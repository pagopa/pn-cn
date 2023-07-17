const { ddbDocClient } = require("./ddbClient.js");
const {
  UpdateCommand,
} = require("@aws-sdk/lib-dynamodb");

function makePartitionKey(event){
  return 'log##'+event.fileKey
}

function makeSortKey(event){
  return 'log##'+event.fileKey+'##'+event.externalId
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
  const attributesToUpdate = ['entityName_externalId', 'fileKey', 'externalId', 
                              'delete_TTL', 'ttlExpirationTimestamp', 'responseTimestamp', 
                              'statusDate', 'status', 'rawResponse']

  const params = {
    TableName: process.env.DYNAMODB_HISTORY_TABLE,
    Key: {
      pk:  makePartitionKey(event),
      sk: makeSortKey(event)      
    },
    ExpressionAttributeValues: {
      ":entityName_externalId": 'log##'+event.externalId,
      ":fileKey": event.fileKey,
      ":externalId": event.externalId,
      ":delete_TTL": Math.floor(nextTtlTs / 1000),
      ":ttlExpirationTimestamp": nextTtl.toISOString(),
      ":responseTimestamp": responseTimestamp.toISOString(),
      ":statusDate": event.statusDate,
      ":status": event.status,
      ":rawResponse": JSON.stringify(event)
    },
    ExpressionAttributeNames: {
      "#response_status": "status"
    },
    ReturnValues: "ALL_NEW",
  };

  if(withError){
    const errorResponseTimestampYearMonth = responseTimestamp.toISOString().substring(0, 7).replace('-', '')
    params.ExpressionAttributeValues[':errorCode_errorResponseTimestampYearMonth'] = event.errorCode+'##'+errorResponseTimestampYearMonth
    params.ExpressionAttributeValues[':errorResponseTimestamp'] = responseTimestamp.toISOString()
    params.ExpressionAttributeValues[':errorResponseTimestampYearMonth'] = errorResponseTimestampYearMonth
    params.ExpressionAttributeValues[':errorCode'] = event.errorCode
    attributesToUpdate.push('errorCode_errorResponseTimestampYearMonth')
    attributesToUpdate.push('errorResponseTimestamp')
    attributesToUpdate.push('errorResponseTimestampYearMonth')
    attributesToUpdate.push('errorCode')
  }

  const updateExpression = 'SET '+attributesToUpdate.map((i) => {
    if(i==='status'){
      return '#response_status = :'+i
    }
    return i+' = :'+i
  }).join(', ')

  params.UpdateExpression = updateExpression
  
  console.debug('PARAMS UPDATE COMMAND', params)
  await ddbDocClient.send(new UpdateCommand(params));
}