const { ddbDocClient } = require("./ddbClient.js");
const {
  DeleteCommand,
  PutCommand,
} = require("@aws-sdk/lib-dynamodb");

function makePartitionKey(event){
  return 'sla##'+event.fileKey
}

function getNextTtl(){
  const date = new Date()
  date.setDate(date.getDate() + 1);
  return date
}

exports.refreshTtl = async function(event){
  const partitionKey = makePartitionKey(event)
  const nextTtl = getNextTtl()
  const nextTtlTs = nextTtl.getTime()
  const params = {
    TableName: process.env.DYNAMODB_REQUEST_TABLE,
    Item: {
      pk: partitionKey,
      sk: partitionKey,
      fileKey: event.fileKey,
      externalId: event.externalId,
      sla_TTL: Math.floor(nextTtlTs / 1000),
      ttlExpirationTimestamp: nextTtl.toISOString()
    }
  };
  await ddbDocClient.send(new PutCommand(params));
}

exports.deleteTtl = async function(event){
  const partitionKey = makePartitionKey(event)
  const params = {
    TableName: process.env.DYNAMODB_REQUEST_TABLE,
    Key: {
      pk: partitionKey,
      sk: partitionKey
    }
  };

  await ddbDocClient.send(new DeleteCommand(params));
}