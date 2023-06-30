const { KinesisClient, PutRecordCommand } = require("@aws-sdk/client-kinesis"); // CommonJS import

function makePartitionKey(event){
    return 'str##'+event.fileKey
}

exports.putEventUpdate = async function(event){
    const client = new KinesisClient({
        region: process.env.REGION,
    });
    
    const buff = new Buffer(JSON.stringify(event));
    let base64data = buff.toString('base64');

    const input = { // PutRecordInput
      Data: base64data, // required
      PartitionKey: makePartitionKey(event),
      StreamARN: process.env.STREAM_ARN,
    };
    const command = new PutRecordCommand(input);
    const response = await client.send(command);
    return response
}