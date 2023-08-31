const { expect } = require("chai");
const proxyquire = require("proxyquire").noPreserveCache();
const { handleEvent } = require('../app/eventHandler.js')
const mockServer = require("mockttp").getLocal();
const { createKinesisEvent, createSecretResponse, createcSostResponseOK } = require("./utils.js")
const kinesisSafeStorage = require('./kinesisSafeStorage.json')
process.env.CONSERVATION_SERVICE_BASE_URL = 'http://localhost:2773'

function proxyquireGen(typeResp){
    return proxyquire.noCallThru().load("../app/eventHandler.js", {
        './eventProcessor': {
            processEvents: () => {
                if(typeResp==="ok") {
                    return {
                       errors: [],
                       ok: [kinesisSafeStorage.kinesisSeqNumber]
                    }
                }
                else {
                    return {
                       errors: [kinesisSafeStorage.kinesisSeqNumber],
                       ok: []
                    }
                }
            }
        },
    });
}

describe('Event Handler Testing', () => {
    beforeEach(() => mockServer.start(2773));
    afterEach(() => mockServer.stop());

    describe('handleEvent' , () => {
        it('handle event with correct response', async () => {
            const processor = proxyquireGen("ok")
            secretCode = "6eb2c20cfcb44e5f9779c3b4f1a81952"
            const secretResponse = createSecretResponse(secretCode)
            mockServer.forGet('http://localhost:2773/secretsmanager/get').withExactQuery('?secretId=pn-cn-Secrets').thenReply(200, JSON.stringify(secretResponse))
                const kinesisEvent = {
                Records: [
                    createKinesisEvent(kinesisSafeStorage)
                ]
            }
            mockServer.forPost(process.env.CONSERVATION_SERVICE_BASE_URL + '/api/v1/uploads/remote').thenReply(200, JSON.stringify(createcSostResponseOK("idRequest")))
            const res = await processor.handleEvent(kinesisEvent)
            expect(res.batchItemFailures).to.be.not.null;
            expect(res.batchItemFailures).to.be.not.undefined;
            expect(res.batchItemFailures).to.be.an("array").that.is.empty
        });
        it('handle event with errors in the response', async () => {
            const processor = proxyquireGen("error")
            secretCode = "6eb2c20cfcb44e5f9779c3b4f1a81952"
            const secretResponse = createSecretResponse(secretCode)
            mockServer.forGet('http://localhost:2773/secretsmanager/get').withExactQuery('?secretId=pn-cn-Secrets').thenReply(200, JSON.stringify(secretResponse))
                const kinesisEvent = {
                Records: [
                    createKinesisEvent(kinesisSafeStorage)
                ]
            }
            mockServer.forPost(process.env.CONSERVATION_SERVICE_BASE_URL + '/api/v1/uploads/remote').thenReply(200, JSON.stringify(createcSostResponseOK("idRequest")))
            const res = await processor.handleEvent(kinesisEvent)
            expect(res.batchItemFailures).to.be.not.null;
            expect(res.batchItemFailures).to.be.not.undefined;
            expect(res.batchItemFailures).to.be.an("array").that.is.not.empty
        });
    });
});
