const { ddbDocClient } = require("./ddbClient.js");
const {
  PutCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand
} = require("@aws-sdk/lib-dynamodb");

function makeRequestPartitionKey(fileKey){
  return 'req##'+fileKey
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

exports.updateRequest = async function(fileKey, externalId, requestTimestamp){
  const partitionKey = makeRequestPartitionKey(fileKey)
  const params = {
    TableName: process.env.DYNAMODB_REQUEST_TABLE,
    Key: {
      pk:  partitionKey,
      sk: partitionKey
    },
    ExpressionAttributeValues: {
      ":externalId": externalId,
      ":requestTimestamp": requestTimestamp.toISOString()
    },
    UpdateExpression: 'SET externalId = :externalId, requestTimestamp = :requestTimestamp',
    ReturnValues: "NONE",
  };

  await ddbDocClient.send(new UpdateCommand(params));
}

exports.getRequest = async function(fileKey){
  const partitionKey = makeRequestPartitionKey(fileKey)
  const params = {
    TableName: process.env.DYNAMODB_REQUEST_TABLE,
    Key: {
      pk: partitionKey,
      sk: partitionKey
    }
  };
  return await ddbDocClient.send(new GetCommand(params));
}

exports.deleteRequest = async function(fileKey){
  const partitionKey = makeRequestPartitionKey(fileKey)
  const params = {
    TableName: process.env.DYNAMODB_REQUEST_TABLE,
    Key: {
      pk: partitionKey,
      sk: partitionKey
    }
  };
  return await ddbDocClient.send(new DeleteCommand(params));
}