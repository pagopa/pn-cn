const { ddbDocClient } = require("./ddbClient.js");
const {
  PutCommand,
  GetCommand,
} = require("@aws-sdk/lib-dynamodb");

function makeRequestTtlPartitionKey(fileKey){
  return 'sla##'+fileKey
}

function makeRequestPartitionKey(fileKey){
  return 'req##'+fileKey
}

function getNextTtl(){
  const date = new Date()
  date.setDate(date.getDate() + 1);
  return date
}

exports.putRequest = async function(fileKey, externalId, metadata, requestTimestamp){
  const partitionKey = makeRequestPartitionKey(fileKey)
  const params = {
    TableName: process.env.DYNAMODB_REQUEST_TABLE,
    Item: {
      pk: partitionKey,
      sk: partitionKey,
      fileKey: fileKey,
      metadata: metadata,
      externalId: externalId,
      requestTimestamp: requestTimestamp.toISOString()
    }
  };
  await ddbDocClient.send(new PutCommand(params));
}


exports.putRequestTTL = async function(fileKey, externalId, requestTimestamp){
  const partitionKey = makeRequestTtlPartitionKey(fileKey)
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