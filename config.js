export default {
    verbose: false,
    cautious: false,
    port: 8080,
    timeout: 500,
    api: {
        binance: {
            baseUrl: "https://api.binance.com",
            timeout: 15000,
            recvWindow: 6000,
            handleDrift: false
        },
        loopring: {
            baseUrl: "https://api.loopring.io/api/v2",
            orderValidTimeS: 3600 * 24 * 90,
            maxFeeBIPS: 20,
            tokens: []
        }
    }
}
