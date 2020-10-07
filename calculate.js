export default {
    loopringOrderParams(symbolParams, midPrice) {
        return symbolParams.map(p => {
            return {
                loopringSymbol: p.loopringSymbol,
                buyPrice: midPrice - (p.spread / 2) - p.additionalDelta,
                sellPrice: midPrice + (p.spread / 2) + p.additionalDelta
            }
        })
    }
}
