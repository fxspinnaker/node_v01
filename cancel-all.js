import orderCanceller from './canceller.js'
import marketParams from './markets.js'

marketParams.forEach(params => orderCanceller.cancelAll(params.nameLoopring))
