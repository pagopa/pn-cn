const { expect } = require("chai");
const { extractKinesisData } = require('../app/kinesis.js')
const lambdaEvents = require('./lambdaEvents.json')
const kinesisEvent = require('./kinesisEvent.json')

describe('kinesis Testing', () => {
//  extractKinesisData
    describe('extractKinesisData Testing', () => {
        
        it('should extract data from kinesis event ', async () => {
            let kinesisEventWithSecNumber = JSON.parse(JSON.stringify(kinesisEvent))
            kinesisEventWithSecNumber.kinesisSeqNumber = '49644824167076596201511769190453670079601595520944963586'
            const res = await extractKinesisData(lambdaEvents)
            expect(res[0]).to.be.deep.equals(kinesisEventWithSecNumber)
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
