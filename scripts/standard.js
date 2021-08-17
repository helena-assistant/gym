require("dotenv").config();
const fs = require("fs");
const watsonService = require("../services/watson");
const data = require("../data/data-v1");

const main = async () => {
  const sessionId = await watsonService.getSession();
  const intents = Object.keys(data);
  const report = [];

  for (intent of intents) {
    const messages = data[intent];
    const reportByIntent = {
      intent,
      numberOfAttempts: 0,
      success: 0,
      accuracy: 0.0,
    };

    const promises = messages.map((message) =>
      watsonService.sendAssistantMessage(message, sessionId)
    );

    const watsonResponses = await Promise.all(promises);

    watsonResponses.forEach((watsonResponse) => {
      reportByIntent.numberOfAttempts += 1;
      const features = watsonService.extractFeatures(watsonResponse);

      if (features.main_intent === intent) {
        reportByIntent.success += 1;
      }
    });

    reportByIntent.accuracy = Number(
      (reportByIntent.success / reportByIntent.numberOfAttempts) * 100
    ).toFixed(3);

    report.push(reportByIntent);
  }

  console.log(report);

  const jsonContent = JSON.stringify(report);

  fs.writeFileSync(`results/standard/result-${new Date()}.json`, jsonContent);
};

main()
  .then(() => console.log("Gym training session is over!"))
  .catch((err) => console.log("Something bad happened", err.toString()));
