const { extractKinesisData } = require('./kinesis')
const { processEvents } = require('./eventProcessor')
exports.handleEvent = async (event) => {

  console.log("event: ", event);

  // basic return payload
  const payload = {
    batchItemFailures: [],
  };

  let processedItems = [];


  // "normal" Kinesis path
  console.log("*** Kinesis processing ***");

  // 1. get event from Kinesis and filter for delete
  const kinesisEvents = extractKinesisData(event);
  console.log(JSON.stringify(kinesisEvents))

  const processSummary = await processEvents(kinesisEvents)

  if (processSummary.errors.length > 0) {
    payload.batchItemFailures = persistSummary.errors.map((i) => {
      return { itemIdentifier: i.kinesisSeqNumber }; 
    });
  }

  console.log('batch itemFailure ', payload)
  
  throw new Error("Not implemented")

  console.log(`Kinesis items to persist`, processedItems);

  // 2. process if reason is TTL: create an Active SLA Violation (part common to Kinesis and SQS path)
  const persistSummary = await processEvents(processedItems); // actually produce changes to DB (in our case create Active Sla Violations or storicize them)

  console.log("Persist summary", persistSummary);
  console.log(`Inserted ${persistSummary.insertions} records`);
  console.log(`Updated ${persistSummary.updates} records`);

  if (persistSummary.errors.length > 0) {
    console.error(
      `Legal Conservation Starter execution finished with ${persistSummary.errors.length} errors`,
      persistSummary.errors
    );
    payload.batchItemFailures = persistSummary.errors.map((i) => {
      return { itemIdentifier: i.kinesisSeqNumber }; 
    });
  }

  return payload;

};
