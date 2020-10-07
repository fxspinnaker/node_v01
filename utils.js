import fs from 'fs'
import appState from './state.js'
import appConfig from './config.js'

export default {
    exitWith(retVal, msg) {
        if (msg) console.log(msg)
        return process.exit(retVal || 1);
    },
    logTime(msg) {
        const t = new Date().getTime()
        console.log(`[${t}] ${msg || ''}...`)
    },
    waitSync(ms) {
        var start = Date.now(), now = start
        while (now - start < ms) now = Date.now()
    },
    cliParams() {
        return process.argv.slice(2)
    },
    getSymbolParamsFromTextFile(symbol) {
        let output = []
        fs.readFileSync('./symbols.txt', 'utf8').toString().split("\n").filter(l => l.indexOf(appState.symbol.binance) === 0).forEach(line => {
            let p = line.split(';')
            if (p.length && (p.length == 6)) {
                if (!p[0].match(/^[A-Z0-9]{4,10}$/)) throw new Error('Invalid Binance symbol in symbols.txt')
                if (!p[1].match(/^[A-Z0-9]{2,6}-[A-Z0-9]{2,6}$/)) throw new Error('Invalid Loopring symbol in symbols.txt')
                for (let i = 2; i <= 5; i++) if (!p[i].match(/^\d*\.?\d*$/)) throw new Error('Invalid numeric field in symbols.txt')

                output.push({
                    binanceSymbol: p[0],
                    loopringSymbol: p[1],
                    amount: parseFloat(p[2]),
                    spread: parseFloat(p[3]),
                    additionalDelta: parseFloat(p[4]),
                    idealInventoryLevel: parseInt(p[5])
                })
            }
        })
        if (!output.length) throw new Error('Failed trying to set order calculation parameters from symbols.txt - check file format')
        return output
    },
    sortAssoc(input) {
        let keys = [], res = {}
        for (key in input) keys.push(key)
        keys.sort().forEach(key => res[key] = input[key])
        return res
    },
    getTokenBySymbol(symbol) { return appConfig.api.loopring.tokens.find(t => t.symbol == symbol) },
    getSymbolParamsByLoopringSymbol(loopringSymbol) { return appState.symbolParams.find(p => p.loopringSymbol == loopringSymbol) }
}
