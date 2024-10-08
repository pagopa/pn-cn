const { extractKinesisData } = require('./kinesis')
const { processEvent } = require('./eventProcessor')  

exports.handleEvent = async (event) => {

    console.log('Received event:', JSON.stringify(event, null, 2));

    const kinesisEvents = extractKinesisData(event);

    for (const record of kinesisEvents) {
        try {
            console.log(`Processing record`, record)
            await processEvent(record)
        }
        catch (e) {
            console.error(e)
            return {
                batchItemFailures: [{ itemIdentifier: record.kinesisSeqNumber }],
            };
        }
    }

    console.log(`Successfully processed ${event.Records.length} records.`);
    return {
        batchItemFailures: []
    }
};
