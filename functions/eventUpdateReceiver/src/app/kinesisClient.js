const { KinesisClient, PutRecordCommand } = require("@aws-sdk/client-kinesis"); // CommonJS import

function makePartitionKey(event){
    return 'str##'+event.fileKey
}

exports.putEventUpdate = async function(event){
    const client = new KinesisClient({
        region: process.env.REGION,
    });
    
    let base64data = Buffer.from(JSON.stringify(event))

    const input = { // PutRecordInput
      Data: base64data, // required
      PartitionKey: makePartitionKey(event),
      StreamARN: process.env.STREAM_ARN,
    };
    const command = new PutRecordCommand(input);
    const response = await client.send(command);
    return response
}