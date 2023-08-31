const { expect } = require("chai");
const { extractKinesisData } = require('../app/kinesis.js')
const kinesisCdc = require('./kinesisCdc.json')
const kinesisSafeStorage = require('./kinesisSafeStorage.json')
const { createKinesisEvent } = require("./utils.js")

describe('kinesis Testing', () => {
//  extractKinesisData
    describe('extractKinesisData Testing', () => {
        it('should extract safestorageOutcome from kinesis event ', async () => {
            const kinesisEvent = {
                Records: [
                    createKinesisEvent(kinesisSafeStorage)
                ]
            }
            const res = await extractKinesisData(kinesisEvent)
            expect(JSON.stringify(res[0])).to.equal(JSON.stringify(kinesisSafeStorage))
        });
        it('should extract CDC from kinesis event ', async () => {
            const kinesisEvent = {
                Records: [
                    createKinesisEvent(kinesisCdc)
                ]
            }
            const res = await extractKinesisData(kinesisEvent)
            expect(JSON.stringify(res[0])).to.equal(JSON.stringify(kinesisCdc))
        });
        it('should return empty array if Records is empty', async () => {
            const kinesisEvent = {
                Records: null
            }
            const res = await extractKinesisData(kinesisEvent)
            expect(res).to.be.an("array").that.is.empty
        });
    });
});
