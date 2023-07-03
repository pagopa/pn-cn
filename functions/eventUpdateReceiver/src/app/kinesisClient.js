const { KinesisClient, PutRecordCommand } = require("@aws-sdk/client-kinesis"); // CommonJS import

function makePartitionKey(event){
    return 'str##'+event.fileKey
}

function getStreamNameFromArn(streamArn){
    return streamArn.split(':stream/')[1]
}

exports.putEventUpdate = async function(event){
    const client = new KinesisClient({
        region: process.env.REGION,
    });
    
    let base64data = Buffer.from(JSON.stringify(event))

    const streamArn = process.env.STREAM_ARN
    const streamName = getStreamNameFromArn(streamArn)
    const input = { // PutRecordInput
      Data: base64data, // required
      PartitionKey: makePartitionKey(event),
      StreamARN: streamArn,
      StreamName: streamName
    };
    const command = new PutRecordCommand(input);
    const response = await client.send(command);
    return response
}