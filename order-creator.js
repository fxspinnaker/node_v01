import logger from './log.js'
import loopringApi from './loopring-api.js'
import credentials from './credentials.js'
import loopringConfig from './lightcone/config/config.json.js'
import { signOrder } from "./lightcone/sign/sign-orders.js"

export function OrderCreator(options) {
    this.binanceApi = options.binanceApi
    this.loopringApi = options.loopringApi
    this.orderCanceller = options.orderCanceller
    this.marketParams = options.marketParams
    this.timestampOffset = options.timestampOffset
    this.tokens = options.tokens
    this.orderIds = {}
    this.binancePrices = {}
    this.midPrice = 0.0
    this.buyPrice = 0.0
    this.sellPrice = 0.0
    this.orders = []
    this.liveOrderHashes = []
    this.iteration = 0

    this.start = function() {
        this.initialise().then(this.loop(this))
    }

    this.initialise = function() {
        //  Initialise this.orderIds
        this.orderIds = []
        this.midPrice = 0.0
        this.buyPrice = 0.0
        this.sellPrice = 0.0
        this.iteration = 0

        const orderIdSymbols = this.marketParams.nameLoopring.split("-")// [ "ETH", "USDT" ]

        orderIdSymbols.map(symbol => {
            const token = this.tokens.find(t => t.symbol == symbol)
            this.orderIds[symbol] = {
                tokenId: token.tokenId,
                orderId: 0
            }
        })

        return loopringApi.getOrderId(this.orderIds[orderIdSymbols[0]].tokenId)
        .then(orderId => { this.orderIds[orderIdSymbols[0]].orderId = orderId })
        .then(() => loopringApi.getOrderId(this.orderIds[orderIdSymbols[1]].tokenId))
        .then(orderId => { this.orderIds[orderIdSymbols[1]].orderId = orderId })

        //  Add open order hashes to orderCanceller
        .then(() => {
            return loopringApi.getOpenOrders(this.marketParams.nameLoopring)
            .then(data => {
                if (data.orders && data.orders.length) {
                    this.log(`Initialising, found ${data.orders.length} open orders...`)
                    this.cancelOrdersByHash(data.orders.map(order => order.hash))
                }
                else this.log("Initialising, no open orders found...")
                return new Promise(res => res())
            })
        })
    }

    this.loop = function(me) {
        me.iteration ++
        me.log(`Start iteration ${me.iteration}...`)

        me.binanceApi.latestPrices(this.marketParams.nameBinance).then(prices => {
            me.log(`Got binance midPrice: ${prices.midPrice}`)

            if (me.midPrice == prices.midPrice) {
                me.log('Prices unchanged...')
                return new Promise(res => setTimeout(res, 150))
            }
            else {
                me.binancePrices = prices

                //  Calculate mid/buy/sell prices
                me.midPrice = me.binancePrices.midPrice
                me.buyPrice = me.midPrice - (me.marketParams.spread / 2) - me.marketParams.additionalDelta
                me.sellPrice = me.midPrice + (me.marketParams.spread / 2) + me.marketParams.additionalDelta

                me.log(`Calculated new prices - Buy = ${me.buyPrice.toFixed(3)}, Sell = ${me.sellPrice.toFixed(3)}...`)

                me.compileOrders()
                me.tellCancellerToCancelLiveOrders()

                return me.submitSignedOrders(me)
            }

        })
        .then(() => me.loop(me))
        .catch(err => console.log(err))
    }

    this.compileOrders = function() {
        this.orders = []
        const symbols = this.marketParams.nameLoopring.split("-")
        this.orders.push({
            symbol: this.marketParams.nameLoopring,
            accountId: credentials.loopring.accountId,
            type: "sell",//                                     I want to sell 0.05 ETH @ 1 ETH = 350 USD
            exchangeId: credentials.loopring.exchangeId,
            tokenS: symbols[0],
            tokenB: symbols[1],
            amountS: this.marketParams.amount,//                     I want to sell 0.05 ETH
            amountB: this.marketParams.amount * this.sellPrice,//      ...for 0.05 * 350 = 17.5 USD (@ high sell price)
            buy: false,
            channelId: loopringConfig.defaultChannelId
        })
        this.orders.push({
            symbol: this.marketParams.nameLoopring,
            accountId: credentials.loopring.accountId,
            type: "buy",//                                     I want to buy 0.05 ETH @ 1 ETH = 340 USD
            exchangeId: credentials.loopring.exchangeId,
            tokenS: symbols[1],
            tokenB: symbols[0],
            amountS: this.marketParams.amount * this.buyPrice,//       I want to sell 0.05 * 340 = 17USD (@ low buy price)
            amountB: this.marketParams.amount,//                     ...for 0.05 ETH
            buy: true,
            channelId: loopringConfig.defaultChannelId
        })

        this.signedOrders = this.orders.map(order => {
            order.validSince = Math.floor((new Date().getTime()) / 1000)
            order.validUntil = order.validSince + this.loopringApi.orderValidTimeS()
            order.orderId = this.nextOrderId(order)
            return signOrder(order, this.loopringApi.keyPair(), this.tokens)
        })

        this.log('Compiled buy/sell orders...')
    }

    this.submitSignedOrders = function(me) {
        if (!me.signedOrders.length) return me.nothingToSubmit()
        me.log('Submitting Loopring Buy/Sell order pair...')

        return loopringApi.postBatchOrders({ orders: me.signedOrders }).then(json => {
            if (json.resultInfo && json.resultInfo.message && (json.resultInfo.message == 'SUCCESS')) {
                let hashes = []
                if (json.data && json.data.length) {
                    hashes = json.data.map(h => h.hash)
                    me.recordOrderHashes(hashes)
                    me.log('Successfully submitted signed buy/sell orders: here are the order hashes (should be 2, one for buy, one for sell)', hashes)
                }
                else {
                    me.log('UNEXPECTED RESULT - Loopring said order submission was OK but returned NO ORDER HASHES!')
                }
            }
            else {
                me.log('UNEXPECTED RESULT - Loopring returned an error or an unusual response:', json)
            }

            return json
        })
    }

    this.nothingToSubmit = function() {
        return new Promise(res => res())
    }

    this.tellCancellerToCancelLiveOrders = function() {
        if (this.liveOrderHashes.length) this.cancelOrdersByHash(this.liveOrderHashes)
    }

    this.cancelOrdersByHash = function(hashes) {
        if (hashes.length) this.orderCanceller.addMultipleHashes(hashes)
    }

    this.recordOrderHashes = function(hashes) {
        this.liveOrderHashes = hashes
    }

    this.nextOrderId = function(order) {
        const orderId = this.orderIds[order.tokenS].orderId
        this.orderIds[order.tokenS].orderId++
        return orderId
    }
    
    this.log = function(message, data) {
        logger.log(`OrderCreator ${this.marketParams.nameBinance}`, message, data || '')
    }
}
