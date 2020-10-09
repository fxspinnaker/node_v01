import binanceApi from './binance-api.js'
import loopringApi from './loopring-api.js'
import { getTokenInfo } from "./lightcone/api/v1/tokeninfo/index.js"
import marketParams from './markets.js'
import orderCanceller from './canceller.js'
import { OrderCreator } from './order-creator.js'

let state = { tsOffset: 0, tokens: [] }

initialise().then(main)

function initialise() {
    return loopringApi.getTimestamp()
    .then(timestamp => { state.tsOffset = Date.now() - timestamp })
    .then(getTokenInfo).then(tkns => state.tokens = tkns)
}

function tokensByMarket(market) {
    let symbols = market.nameLoopring.split('-')
    return state.tokens.filter(tkn => symbols.find(s => s == tkn.symbol))
}

function main() {
    const orderCreators = marketParams.map(market => {
        return new OrderCreator({
            binanceApi: binanceApi,
            loopringApi: loopringApi,
            orderCanceller: orderCanceller,
            timestampOffset: state.tsOffset,
            marketParams: market,
            tokens: tokensByMarket(market)
        })
    })

    orderCanceller.start()
    orderCreators.forEach(orderCreator => orderCreator.start())
}
