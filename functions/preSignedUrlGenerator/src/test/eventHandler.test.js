// basic event
const { expect } = require("chai");
const { handleEvent } = require("../app/eventHandler.js");
const mockServer = require("mockttp").getLocal();
const { createEvent } = require('./utils.js')
const mockResponse = require("../response.json");
const port = 8080;
process.env.SAFESTORAGE_BASE_URL = "http://localhost:8080"
process.env.SAFESTORAGE_CLIENT_ID = "testing"

describe('Lambda Handler', () => {
    beforeEach(() => mockServer.start(port));
    afterEach(() => mockServer.stop());

    describe('Lambda Handler', () => {
            it('should return OK status', async () => {
            const event = createEvent('GET', '/cn/v1/files/pippo');
            mockServer.forGet('/v1/files/pippo').thenReply(200, JSON.stringify(mockResponse))
            const res = await handleEvent(event)
            expect(res).to.not.be.null;
            expect(res).to.not.be.undefined;
            expect(res.statusCode).to.equal(200);
        });

        it('should return 404 caused by POST in event', async () => {
            const event = createEvent('POST', '/cn/v1/files/pippo');
            mockServer.forGet('/v1/files/pippo').thenReply(200, JSON.stringify(mockResponse))
            const res = await handleEvent(event)
            expect(res).to.not.be.null;
            expect(res).to.not.be.undefined;
            expect(res.statusCode).to.equal(404);
        });

        it('should return 400 caused by FileKey void in path', async () => {
            const event = createEvent('GET', "/cn/v1/files/");
            mockServer.forGet('/v1/files/pippo').thenReply(200, JSON.stringify(mockResponse))
            const res = await handleEvent(event)
            expect(res).to.not.be.null;
            expect(res).to.not.be.undefined;
            expect(res.statusCode).to.equal(400);
        });
    });



});
