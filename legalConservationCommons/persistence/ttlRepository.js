const { ddbDocClient } = require("./ddbClient.js");
const {
  DeleteCommand,
  PutCommand,
} = require("@aws-sdk/lib-dynamodb");

function makePartitionKey(fileKey){
  return 'sla##'+fileKey
}

function getNextTtl(){
  const date = new Date()
  date.setDate(date.getDate() + 1);
  return date
}

exports.refreshRequestTTL = async function(event){
  const partitionKey = makePartitionKey(event.fileKey)
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

exports.deleteRequestTTL = async function(event){
  const partitionKey = makePartitionKey(event.fileKey)
  const params = {
    TableName: process.env.DYNAMODB_REQUEST_TABLE,
    Key: {
      pk: partitionKey,
      sk: partitionKey
    }
  };

  await ddbDocClient.send(new DeleteCommand(params));
}

exports.putRequestTTL = async function(fileKey, externalId, requestTimestamp){
  const partitionKey = makePartitionKey(fileKey)
  const nextTtl = getNextTtl()
  const nextTtlTs = nextTtl.getTime()
  const params = {
    TableName: process.env.DYNAMODB_REQUEST_TABLE,
    Item: {
      pk: partitionKey,
      sk: partitionKey,
      fileKey: fileKey,
      externalId: externalId,
      requestTimestamp: requestTimestamp.toISOString(),
      sla_TTL: Math.floor(nextTtlTs / 1000),
      ttlExpirationTimestamp: nextTtl.toISOString()
    }
  };
  await ddbDocClient.send(new PutCommand(params));
}