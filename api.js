function dialogFlow(query) {

  const projectId = 'grover-b350e'; //https://dialogflow.com/docs/agents#settings
  const sessionId = 'quickstart-session-id';
  const languageCode = 'en-US';

  const dialogflow = require('dialogflow');
  const sessionClient = new dialogflow.SessionsClient();

  const sessionPath = sessionClient.sessionPath(projectId, sessionId);

  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: query,
        languageCode: languageCode
      }
    }
  };
  return sessionClient.detectIntent(request).then(responses => {
    console.log('Detected intent');
    const result = responses[0].queryResult;
    console.log(`  Query: ${result.queryText}`);
    console.log(`  Response: ${result.fulfillmentText}`);
    if (result.intent) {
      console.log(`  Intent: ${result.intent.displayName}`);
    } else {
      console.log(`  No intent matched.`);
    }
    return result.fulfillmentText

}).catch(err => {
  console.error('ERROR:', err);
});
};

exports.dialogFlow = dialogFlow;
