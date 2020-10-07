import logger from './log.js'
import { signCancelOrdersByHash } from "./lightcone/sign/sign-orders.js"
import loopringApi from './loopring-api.js'

let orderHashes = [], i

function log(message, data) { logger.log('*** Canceller ***', message, data || '') }

function cancelOrders() {
    if (!orderHashes.length) return new Promise(res => res())
    const l = orderHashes.length
    if (l >= 8) log(`WARNING - ${l} ORDERS TO CANCEL`)
    return loopringApi.cancelOrdersByHash(signCancelOrdersByHash(
        { accountId: loopringApi.accountId(), orderHash: [...orderHashes].join(',') },
        loopringApi.keyPair()
    )).then(json => {
        const cancelled = json.data.filter(resultObject => {
            if(resultObject.result) return true
            return resultObject.error && resultObject.error.code && (0 <= [102117, 102122].indexOf(resultObject.error.code))
        })
        log(`Cancelled ${l} orders by hash...`)
        orderHashes = orderHashes.filter(hash => !cancelled.find(resultObject => resultObject.id == hash))
    }).catch(err => {
        log("ERROR trying to cancel orders by hash...", err)
    })
}

export default {
    addHash(hash) { orderHashes.push(hash) },
    addMultipleHashes(hashes) { hashes.map(hash => this.addHash(hash)) },
    cancelAll(market) {
        loopringApi.getOpenOrders(market).then(data => {
            if (data.orders && data.orders.length) {
                orderHashes = data.orders.map(order => order.hash)
                log(`cancelAll - found open orders for ${market} market...`, orderHashes)
                return cancelOrders()
            }
            else {
                log(`cancelAll - nothing to cancel for ${market} market...`)
            }
        })
    },
    start(intervalTime) { i = setInterval(cancelOrders, intervalTime || 500) }
}
