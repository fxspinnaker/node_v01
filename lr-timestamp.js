import loopringApi from './loopring-api.js'

loopringApi.getTimestamp().then(ts => {
    console.log(`lr-timestamp.js getTimestamp JSON: `, ts)
})
