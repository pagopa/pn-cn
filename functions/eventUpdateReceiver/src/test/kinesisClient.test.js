// basic event
const { expect } = require("chai");
const { createEvent, generateEventBody } = require('./utils.js')
const mockResponse = require("./mockResponse.json");
const conservationEvent = require("./conservationEvent.json");
const { putEventUpdate } = require("../app/kinesisClient.js");
const { mockClient } = require("aws-sdk-client-mock");
const proxyquire = require("proxyquire").noPreserveCache();
const { KinesisClient, PutRecordCommand } = require("@aws-sdk/client-kinesis");
process.env.STREAM_ARN = 'arn:aws:kinesis:eu-south-1:012345678910:stream/pn-cdc-legal-conservation-stream-001'

describe('kinesisClient Testing', () => {
    describe('putEventUpdate Testing', () => {
        const ddbMock = mockClient(KinesisClient);
        beforeEach(() => {
            ddbMock.reset();
        });
        it('should parse the information correctly and return the mock result', async () => {
            ddbMock.on(PutRecordCommand).resolves({
                ShardId: "shardId-00000001693281366489-8d4beeb6", // required
                SequenceNumber: "12345", // required
                EncryptionType: "NONE",
            })
            const event = conservationEvent
            const res = await putEventUpdate(event)
            expect(res).to.not.be.null;
            expect(res).to.not.be.undefined;
            expect(res.ShardId).to.equal('shardId-00000001693281366489-8d4beeb6');
        });
    });
});

