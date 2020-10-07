import fetch from 'node-fetch'
import appConfig from './config.js'
import credentials from './credentials.js'

const baseUrl = `${appConfig.api.loopring.baseUrl}/`
const apiKey = credentials.loopring.key
const accountId = credentials.loopring.accountId

function addUrlParams(url, params) {
    let s = ''
    if(params) {
        for (let key in params) s = s + (s == '' ? '?' : '&') + encodeURI(key) + '=' + encodeURI(params[key])
    }
    return `${url}${s}`
}

function get(url) {
    return fetch(url, {headers: { 'X-API-KEY': apiKey }}).then(res => res.json()).then(json => json.data)
}

export default {
    orderValidTimeS() { return appConfig.api.loopring.orderValidTimeS },
    accountId() { return credentials.loopring.accountId },
    keyPair() { return credentials.loopring.keyPair },
    getTimestamp() { return get(`${baseUrl}timestamp`) },
    getOrderId(tokenSId) {
        return get(addUrlParams(`${baseUrl}orderId`, { accountId: accountId, tokenSId: tokenSId }))
    },
    getOpenOrders(market) {
        return get(addUrlParams(`${baseUrl}orders`, {accountId: accountId, market: market, status: "processing", limit: 150}))
    },
    postBatchOrders(orders) {
        return fetch(`${baseUrl}batchOrders`, {
            method: 'post', body: JSON.stringify(orders),
            headers: { 'Content-Type': 'application/json', 'X-API-KEY': apiKey }
        }).then(res => {
            const now = new Date()
            const time = ("00" + now.getHours()).slice(-2) + ":" + ("00" + now.getMinutes()).slice(-2) + ":" + ("00" + now.getSeconds()).slice(-2) + "." + ("000" + now.getMilliseconds()).slice(-3)

            if ((res.status < 200) || (res.status >= 300)) {
                const title = `LoopringAPI.batchOrders ${time}`
                console.log(title.bgRed.brightWhite + ' - ' + `Status = ${res.status}`.brightRed + `\n`)
            }
            else console.log(`LoopringAPI.batchOrders`.brightGreen + ' ' + time.green + ' - ' + `Status = ${res.status}`.brightWhite + `\n`)

            return res.json()
        })
    },
    cancelOrdersByHash(cancel) {
        return fetch(`${baseUrl}orders/byHash?accountId=${cancel.accountId}&orderHash=${cancel.orderHash}`, { 
            method: 'delete', 
            headers: { 'X-API-KEY': apiKey, 'X-API-SIG': `${cancel.signature.Rx},${cancel.signature.Ry},${cancel.signature.s}` } 
        }).then(res => {
            return res.json()
        }).catch(err => { console.log(`fetch.catch.err`, err) })
    }
}
