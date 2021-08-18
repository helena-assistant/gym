require("dotenv").config();
const fs = require("fs");
const watsonService = require("../services/watson");
const data = require("../data/data-mixed");

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

const selectMessagesRandomly = () => {
  const NUMBER_OF_ATTEMPTS = 200;
  const intents = Object.keys(data);
  const numberOfAvailableIntents = intents.length - 1;
  const randomMessages = [];

  for (let i = 0; i < NUMBER_OF_ATTEMPTS; i++) {
    const randomIntentIndex = Math.floor(
      Math.random() * numberOfAvailableIntents + 1
    );

    const selectedRandomIntent = intents[randomIntentIndex];
    const messages = data[selectedRandomIntent];
    const convertedMessages = convertMessages(messages);
    const numberOfMessages = convertedMessages.length - 1;
    const randomMessageIndex = Math.floor(Math.random() * numberOfMessages + 1);
    const selectedRandomMessage = convertedMessages[randomMessageIndex];

    randomMessages.push({
      message: selectedRandomMessage,
      intent: selectedRandomIntent,
    });
  }

  return randomMessages;
};

const main = async () => {
  const sessionId = await watsonService.getSession();
  const report = [];

  const randomMessages = selectMessagesRandomly();

  const reportByIntent = {
    numberOfAttempts: 0,
    success: 0,
    accuracy: 0.0,
  };

  const promises = randomMessages.map((item) =>
    watsonService.sendAssistantMessage(item.message.text, sessionId)
  );

  const watsonResponses = await Promise.all(promises);

  watsonResponses.forEach((watsonResponse) => {
    const features = watsonService.extractFeatures(watsonResponse);
    const { intent, message } = randomMessages[reportByIntent.numberOfAttempts];

    if (features.main_intent === intent && message.shouldBeCorrect) {
      reportByIntent.success += 1;
    } else if (features.main_intent !== intent && !message.shouldBeCorrect) {
      reportByIntent.success += 1;
    }

    reportByIntent.numberOfAttempts += 1;
  });

  reportByIntent.accuracy = Number(
    (reportByIntent.success / reportByIntent.numberOfAttempts) * 100
  ).toFixed(3);

  report.push(reportByIntent);

  console.log(report);

  const jsonContent = JSON.stringify(report);

  fs.writeFileSync(
    `results/random-mixed/result-${new Date()}.json`,
    jsonContent
  );
};

main()
  .then(() => console.log("Gym training session is over!"))
  .catch((err) => console.log("Something bad happened", err.toString()));
