const { ddbDocClient } = require("./ddbClient.js");
const {
  GetCommand,
} = require("@aws-sdk/lib-dynamodb");


exports.getDocument = async function(fileKey){
  const partitionKey = fileKey
  const params = {
    TableName: "pn-SsDocumenti",
    Key: {
      documentKey: partitionKey
    }
  };
  return await ddbDocClient.send(new GetCommand(params));
}