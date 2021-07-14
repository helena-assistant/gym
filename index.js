require('dotenv').config()
const watsonService = require("./services/watson")
const data = require('./data')

const main = async () => {
    const sessionId = await watsonService.getSession()
    const intents = Object.keys(data)
    const report = []

    for (intent of intents) {
        const messages = data[intent]
        const reportByIntent = {
            intent,
            wasAnswered: 0,
            numberOfAttempts: 0,
            success: 0
        }

        for (message of messages) {
            reportByIntent.numberOfAttempts += 1
            const watsonResponse = await watsonService.sendAssistantMessage(
                message,
                sessionId
            )

            const features = watsonService.extractFeatures(watsonResponse)

            if (features.was_answered) {
                reportByIntent.wasAnswered += 1
            }

            if (features.main_intent === intent) {
                reportByIntent.success += 1
            }

        }

        report.push(reportByIntent)
    }

    console.log(report)

}


main()
    .then(() => console.log('Gym training session is over!'))
    .catch((err) => console.log('Something bad happened', err.toString()))
