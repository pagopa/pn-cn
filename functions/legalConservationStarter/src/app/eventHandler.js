const { extractKinesisData } = require('./kinesis')
const { processEvents } = require('./eventProcessor')
const { getSecret } = require('./secretManager')

exports.handleEvent = async (event) => {

  console.log("event: ", event);

  const secrets = await getSecret('pn-cn-Secrets')

  if(event.isFake){
    await processEvents([event], secrets)
  }
  
  // basic return payload
  const payload = {
    batchItemFailures: [],
  };

  if(process.env.ENV_TYPE==='dev'){
    // csost service integration disabled, waiting for mock
    throw new Error("Not implemented") // the error is thrown to disable integration with csost service
  }

  // "normal" Kinesis path
  console.log("*** Kinesis processing ***");

  // 1. get event from Kinesis and filter for delete
  const kinesisEvents = extractKinesisData(event);
  console.log(JSON.stringify(kinesisEvents))

  const processSummary = await processEvents(kinesisEvents, secrets)

  if (processSummary.errors.length > 0) {
    payload.batchItemFailures = processSummary.errors.map((i) => {
      return { itemIdentifier: i.kinesisSeqNumber }; 
    });
  }

  console.log('batch itemFailure ', payload)

  return payload;
};
