const { ddbDocClient } = require("./ddbClient.js");
const {
  PutCommand,
} = require("@aws-sdk/lib-dynamodb");

function makePartitionKey(fileKey){
  return 'log##'+fileKey
}

function makeSortKey(fileKey, externalId){
  return 'log##'+fileKey+'##'+externalId
}

exports.putHistory = async function(fileKey, externalId, metadata, requestTimestamp){
  const params = {
    TableName: process.env.DYNAMODB_HISTORY_TABLE,
    Item: {
      pk:  makePartitionKey(fileKey),
      sk: makeSortKey(fileKey, externalId),
      entityName_externalId: 'log##'+externalId,
      fileKey: fileKey,
      externalId: externalId,
      requestTimestamp: requestTimestamp.toISOString(),
      metadata: metadata
    }
  };

  await ddbDocClient.send(new PutCommand(params));
}