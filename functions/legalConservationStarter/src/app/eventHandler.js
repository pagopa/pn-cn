const { extractKinesisData } = require('./kinesis')
const { processEvents } = require('./eventProcessor')
const { getSecret } = require('./secretManager')

exports.handleEvent = async (event) => {

  console.log("event: ", event);

  let secrets = null
  
  try {
    secrets = await getSecret('pn-cn-Secrets')
  } catch(e){
    // return error to kinesis
    return {
      batchItemFailures: [{
        itemIdentifier: null
      }]
    }
  }

  if(event.isFake){
    const s = await processEvents([event], secrets)
    console.log('fake summary', s)
  }
  
  // basic return payload
  const payload = {
    batchItemFailures: [],
  };

  // "normal" Kinesis path
  console.log("*** Kinesis processing ***");

  // 1. get event from Kinesis and filter for delete
  const kinesisEvents = extractKinesisData(event);
  console.log(JSON.stringify(kinesisEvents))

  const processSummary = await processEvents(kinesisEvents, secrets)

  if (processSummary.errors.length > 0) {
    payload.batchItemFailures = processSummary.errors.map((i) => {
      return { itemIdentifier: i }; 
    });
  }

  console.log('batch itemFailure ', payload)

  return payload;
};
