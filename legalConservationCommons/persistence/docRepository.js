const { ddbDocClient } = require("./ddbClient.js");
const {
  GetCommand,
} = require("@aws-sdk/lib-dynamodb");

function makeFileKeyPartitionKey(fileKey){
  return 'safestorage://'+fileKey
}

exports.getDocument = async function(fileKey){
  const partitionKey = makeFileKeyPartitionKey(fileKey)
  const params = {
    TableName: process.env.DYNAMODB_DOC_TABLE,
    Key: {
      pk: partitionKey
    }
  };
  return await ddbDocClient.send(new GetCommand(params));
}