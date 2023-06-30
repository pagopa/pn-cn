const { ddbDocClient } = require("./ddbClient.js");
const {
  DeleteCommand,
  PutCommand,
  GetCommand,
  BatchGetCommand,
  BatchWriteCommand,
} = require("@aws-sdk/lib-dynamodb");
const { twoNumbersFromIUN } = require("./utils");

function makePartitionKey(event){
  return 'log##'+event.fileKey
}

function makeSortKey(event){
  return 'log##'+event.fileKey+event.externalId
}

function getNextTtl(withError = false){
  const days = withError?365:180
  const date = new Date()
  date.setDate(date.getDate() + days);
  return date
}

exports.putResponse = async function(event, withError = false){
  const nextTtl = getNextTtl(withError)
  const nextTtlTs = nextTtl.getTime()

  const responseTimestamp = new Date()
  const params = {
    TableName: process.env.DYNAMODB_HISTORY_TABLE,
    Item: {
      pk:  makePartitionKey(event),
      sk: makeSortKey(event),
      entityName_externalId: 'log##'+event.externalId,
      fileKey: event.fileKey,
      externalId: event.externalId,
      delete_TTL: Math.floor(nextTtlTs / 1000),
      ttlExpirationTimestamp: nextTtl.toISOString(),
      responseTimestamp: responseTimestamp.toISOString(),
      statusDate: event.statusDate,
      status: event.status,
      errorCode: event.errorCode,
      rawResponse: JSON.stringify(event.rawResponse)
    }
  };

  if(withError){
    const errorResponseTimestampYearMonth = date.toISOString().substring(0, 7).replace('-', '')
    params.Item.errorCode_errorResponseTimestampYearMonth = event.errorCode+'##'+errorResponseTimestampYearMonth
    params.Item.errorResponseTimestamp = responseTimestamp.toISOString()
    params.Item.errorResponseTimestampYearMonth = errorResponseTimestampYearMonth

  }
  await ddbDocClient.send(new PutCommand(params));
}