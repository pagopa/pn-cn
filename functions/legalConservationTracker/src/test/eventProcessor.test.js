const { expect } = require("chai");
const proxyquire = require("proxyquire").noPreserveCache();
const sinon = require('sinon');
const deleteRequestStub = sinon.stub();
const kinesisEvent = require('./kinesisEvent.json')
const kinesisEventError = require('./kinesisEventError.json')

const proxyOK = proxyquire.noCallThru().load("../app/eventProcessor.js", {
                'legal-conservation-commons': {
                    requestRepository: {
                        deleteRequest: deleteRequestStub
                    }
                },
                './safeStorageClient': {
                    putUpdateTags: () => {
                        return {
                            statusCode: 200,
                        }
                    }
                },
            });
        
const proxyErr = proxyquire.noCallThru().load("../app/eventProcessor.js", {
                './safeStorageClient': {
                    putUpdateTags: () => {
                        return {
                            statusCode: 400,
                        }
                    }
                },
            });


describe('eventProcessor Testing', () => {
    it('processEvents handled Correctly with standard provider', async () => {
        let error = null;
        try {
            await proxyOK.processEvent(kinesisEvent)
        } catch (err) {
            error = err;
        }
        expect(error).to.be.null;
    });

    it('processEvents handled Correctly with no standard provider', async () => {
        let kinesisEventWithDifferentProvider = JSON.parse(JSON.stringify(kinesisEvent))
        kinesisEventWithDifferentProvider['serviceProvider'] = "other_provider"
        let error = null;
        try {
            await proxyOK.processEvent(kinesisEventWithDifferentProvider)
        } catch (err) {
            error = err;
        }
        expect(error).to.be.null;
    });

    it('processEvents handled with error putTags', async () => {
        try {
            await proxyErr.processEvent(kinesisEvent)
        }
        catch (error) {
            expect(error).to.not.be.null;
            expect(error).to.not.be.undefined;
            expect(error.message).to.equal(`Problem to update tags for fileKey ${kinesisEventError.fileKey}`);
        }
    });

    it('processEvents throws error', async () => {
        try {
            await proxyOK.processEvent(kinesisEventError)
        }
        catch (error) {
            expect(error).to.not.be.null;
            expect(error).to.not.be.undefined;
            expect(error.message).to.equal(`Legal Conservation error failed for fileKey ${kinesisEventError.fileKey}`);
        }
    });
});
