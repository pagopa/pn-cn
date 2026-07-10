const { expect } = require("chai");
const { ingestDocument } = require('../app/csostClient.js')
const mockServer = require("mockttp").getLocal();
const { createcSostResponseOK, createcSostResponseErr } = require("./utils.js")
process.env.CONSERVATION_SERVICE_BASE_URL = "http://localhost:2773"
const payloadRequest = require('./payloadRequest.json')

describe('Csost Client Testing', () => {
    beforeEach(() => mockServer.start(2773));
    afterEach(() => mockServer.stop());

    describe('ingestDocument Test' , () => {
        it('Mocked Response with correct request payload', async () => {
            mockServer.forPost(process.env.CONSERVATION_SERVICE_BASE_URL + '/api/v1/uploads/remote').thenReply(200, JSON.stringify(createcSostResponseOK("idRequest")))
            res = await ingestDocument(payloadRequest, {apiKey : "secretApiKey"})
            expect(res.status).to.be.not.null;
            expect(res.status).to.be.not.undefined;
            expect(res.status).to.be.equal(200)
        });
        it('Mocked Response with error request payload', async () => {
            mockServer.forPost(process.env.CONSERVATION_SERVICE_BASE_URL + '/api/v1/uploads/remote').thenReply(400, JSON.stringify(createcSostResponseErr("E_UPLOAD_302", "Error Message", "Error")))
            res = await ingestDocument(payloadRequest, {apiKey : "secretApiKey"})
            expect(res.status).to.be.not.null;
            expect(res.status).to.be.not.undefined;
            expect(res.status).to.be.equal(400)
        });
        it('Retries and throws when fetch raises an exception', async () => {
            const originalFetch = global.fetch;
            const originalSetTimeout = global.setTimeout;
            const expectedError = new Error('network error');
            let attempts = 0;

            global.fetch = async () => {
                attempts += 1;
                throw expectedError;
            };
            global.setTimeout = (callback) => {
                callback();
                return 0;
            };

            try {
                await ingestDocument(payloadRequest, {apiKey : "secretApiKey"});
                expect.fail('Expected ingestDocument to throw');
            } catch (error) {
                expect(error).to.equal(expectedError);
                expect(attempts).to.be.equal(4);
            } finally {
                global.fetch = originalFetch;
                global.setTimeout = originalSetTimeout;
            }
        });
    });
});
