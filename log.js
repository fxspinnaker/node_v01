import colors from 'colors'

export default {
    log(clientName, message, data) {
        const now = new Date()
        const time = ("00" + now.getHours()).slice(-2) + ":" + ("00" + now.getMinutes()).slice(-2) + ":" + ("00" + now.getSeconds()).slice(-2) + "." + ("000" + now.getMilliseconds()).slice(-3)
        console.log(clientName.brightYellow + ' ' + time.yellow + ' - ' + `${message}`.brightWhite + `\n`, data)
    }
}
