require("dotenv").config();
const fs = require("fs");
const watsonService = require("../services/watson");
const data = require("../data/data-mixed");
const { NOT_ANSWERED_INTENT } = require("../constants");

const convertMessages = (messages) => {
  const correctMessages = messages.correct.map((message) => ({
    text: message,
    shouldBeCorrect: true,
  }));

  const incorrectMessages = messages.incorrect.map((message) => ({
    text: message,
    shouldBeCorrect: false,
  }));

  return Array.prototype.concat(correctMessages, incorrectMessages);
};

const main = async () => {
  const sessionId = await watsonService.getSession();
  const intents = Object.keys(data);
  const report = [];

  for (intent of intents) {
    const messages = convertMessages(data[intent]);
    const reportByIntent = {
      intent,
      numberOfAttempts: 0,
      success: 0,
      notAnswered: 0,
      accuracy: 0.0,
    };

    const promises = messages.map((message) =>
      watsonService.sendAssistantMessage(message.text, sessionId)
    );

    const watsonResponses = await Promise.all(promises);

    watsonResponses.forEach((watsonResponse) => {
      const features = watsonService.extractFeatures(watsonResponse);
      const currentMessage = messages[reportByIntent.numberOfAttempts];

      if (features.main_intent === NOT_ANSWERED_INTENT) {
        reportByIntent.notAnswered += 1;
      } else if (
        currentMessage.shouldBeCorrect &&
        features.main_intent === intent
      ) {
        reportByIntent.success += 1;
      } else if (
        !currentMessage.shouldBeCorrect &&
        features.main_intent !== intent
      ) {
        reportByIntent.success += 1;
      }

      reportByIntent.numberOfAttempts += 1;
    });

    reportByIntent.accuracy = Number(
      (reportByIntent.success / reportByIntent.numberOfAttempts) * 100
    ).toFixed(3);

    report.push(reportByIntent);
  }

  console.log(report);

  const jsonContent = JSON.stringify(report);

  fs.writeFileSync(`results/mixed/result-${new Date()}.json`, jsonContent);
};

main()
  .then(() => console.log("Gym training session is over!"))
  .catch((err) => console.log("Something bad happened", err.toString()));
