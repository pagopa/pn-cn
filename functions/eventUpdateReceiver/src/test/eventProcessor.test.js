// basic event
const { expect } = require("chai");
const { createEvent, generateEventBody } = require('./utils.js')
const handleEvent = require("../app/eventHandler.js");
const proxyquire = require("proxyquire").noPreserveCache();
const mockResponse = require("./mockResponse.json");
const conservationEvent = require("./conservationEvent.json");

describe('eventProcessor Testing', () => {
       const processor = proxyquire.noCallThru().load("../app/eventProcessor.js", {
            'legal-conservation-commons': {
                historyRepository: {
                    updateHistoryItemWithResponse: () => {},
                },
                ttlRepository: {
                    refreshRequestTTL: () => {},
                    deleteRequestTTL: () => {},
                },
            },
            './kinesisClient': {
                putEventUpdate: () => {
                    return {
                       ShardId: "shardId-00000001693281366489-8d4beeb6", // required
                       SequenceNumber: "12345", // required
                       EncryptionType: "NONE",
                   }
                }
            }
        });
    describe('processEventUpdate Testing', () => {
        it('Test if event body is ok', async () => {
            const event = generateEventBody('3Z9SdhZ50PBeIj617KEMrztNKDMJj8FZ', 'PN_EXTERNAL_LEGAL_FACTS-6eb2c20cfcb44e5f9779c3b4f1a81952.pdf','OK')
            const res = await processor.processEventUpdate(event)
            expect(res).to.not.be.null;
            expect(res).to.be.undefined;
        });
        it('Test if event body is not ok', async () => {
            const event = generateEventBody('3Z9SdhZ50PBeIj617KEMrztNKDMJj8FZ', 'PN_EXTERNAL_LEGAL_FACTS-6eb2c20cfcb44e5f9779c3b4f1a81952.pdf','KO')
            const res = await processor.processEventUpdate(event)
            expect(res).to.not.be.null;
            expect(res).to.be.undefined;
        });
    });
});
