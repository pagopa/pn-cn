exports.createSecretResponse = function(secret){
    return {
        SecretString: "{\"secret\": \"" + secret +"\"}"
    }
}


exports.createcSostResponseErr = function(codeResp, messageResp, levelResp){
    return {
        status: 400,
        code: codeResp,
        message: messageResp,
        level: levelResp
    }
}

exports.createcSostResponseOK = function(idResp){
    return {
        status: 200,
        id: idResp
    }
}

exports.createKinesisEvent = function(data){
    return {
       "kinesis": {
           "kinesisSchemaVersion": "1.0",
           "partitionKey": "1",
           "sequenceNumber": "49590338271490256608559692538361571095921575989136588898",
           "data": btoa(JSON.stringify(data)),
           "approximateArrivalTimestamp": 1545084650.987
       },
       "eventSource": "aws:kinesis",
       "eventVersion": "1.0",
       "eventID": "shardId-000000000006:49590338271490256608559692538361571095921575989136588898",
       "eventName": "aws:kinesis:record",
       "invokeIdentityArn": "arn:aws:iam::123456789012:role/lambda-role",
       "awsRegion": "us-east-2",
       "eventSourceARN": "arn:aws:kinesis:us-east-2:123456789012:stream/lambda-stream"
   }
}