import appConfig from "./config.js"
import api from "./loopring-api.js"

// api.getTimestamp().then(data => console.log(`Timestamp`, data))

api.getOpenOrders("ETH-USDT").then(data => console.log(`Open Orders`, data))
