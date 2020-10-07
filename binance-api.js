import fetch from 'node-fetch'
import colors from 'colors'

const baseUrl = 'https://api.binance.com/api/v3/'

export default {
    latestPrices(symbol) { 
        return fetch(`${baseUrl}depth?symbol=${symbol}&limit=5`)
        .then(res => { 
            const now = new Date()
            const time = ("00" + now.getHours()).slice(-2) + ":" + ("00" + now.getMinutes()).slice(-2) + ":" + ("00" + now.getSeconds()).slice(-2) + "." + ("000" + now.getMilliseconds()).slice(-3)

            if ((res.status < 200) || (res.status >= 300)) {
                const title = `BinanceAPI.depth.${symbol} ${time}`
                console.log(title.bgRed.brightWhite + ' - ' + `Status = ${res.status}`.brightRed + `\n`)
            }
            else console.log(`BinanceAPI.depth.${symbol}`.brightGreen + ' ' + time.green + ' - ' + `Status = ${res.status}`.brightWhite + `\n`)

            return res.json()
        })
        .then(data => {
            const result = {
                bidPrice: parseFloat(data.bids[0][0]),
                askPrice: parseFloat(data.asks[0][0])
            }
            result.midPrice = parseFloat(((result.bidPrice + result.askPrice) / 2).toFixed(8))
            return result
        })
    }
}
