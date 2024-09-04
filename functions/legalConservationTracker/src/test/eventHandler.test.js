const { expect } = require("chai");
const proxyquire = require("proxyquire").noPreserveCache();
const sinon = require('sinon');
const processEvent = sinon.stub();
const lambdaEvents = require('./lambdaEvents.json')
const mockServer = require("mockttp").getLocal();
const fileKey = "PN_AAR-52a7acf554dd48f2864cb0f0ee807ce7.pdf"

const proxyOK = proxyquire.noCallThru().load("../app/eventHandler.js", {
    './eventProcessor': {
        processEvent: processEvent
    },
});

const proxyErr = proxyquire.noCallThru().load("../app/eventHandler.js", {
    './eventProcessor': {
        processEvent:  () => {
            throw new Error("Exception")
        }
    },
});

describe('Event Handler Testing', () => {
    beforeEach(() => mockServer.start(2773));
    afterEach(() => mockServer.stop());

    describe('handleEvent' , () => {
        it('handle event with correct response', async () => {
            const tags = {
                lc_external_id: "MOCK##711aeff3-1f43-4a48-8798-f268bdb23ea6",
                lc_start_date: "2023-09-25T09:26:47.380Z",
                lc_service_provider: "Comdata"
            }
            mockServer.forPut(`/safestorage/internal/v1/documents/${fileKey}/tags`).thenReply(200, JSON.stringify(tags))
            const res = await proxyOK.handleEvent(lambdaEvents)
            expect(res.batchItemFailures).to.be.not.null;
            expect(res.batchItemFailures).to.be.not.undefined;
            expect(res.batchItemFailures).to.be.an("array").that.is.empty
        });

        it('handle event with errors in the response', async () => {
            mockServer.forPut(`/safestorage/internal/v1/documents/${fileKey}/tags`).thenReply(400, 'Bad request')
            const res = await proxyErr.handleEvent(lambdaEvents)
            expect(res.batchItemFailures).to.be.not.null;
            expect(res.batchItemFailures).to.be.not.undefined;
            expect(res.batchItemFailures).to.be.an("array").that.is.not.empty
        });
    });
});
