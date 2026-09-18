const { expect } = require("chai");
const { resolveOutcome, logDownstreamCall, instrumentDownstreamCall } = require('legal-conservation-commons')
const mockServer = require("mockttp").getLocal();

describe('Downstream Call Logger Testing', () => {
    describe('resolveOutcome Test', () => {
        it('should return SUCCESS for 2xx status', () => {
            expect(resolveOutcome(200)).to.equal('SUCCESS')
        });
        it('should return CLIENT_ERROR for 4xx status', () => {
            expect(resolveOutcome(404)).to.equal('CLIENT_ERROR')
        });
        it('should return SERVER_ERROR for 5xx status', () => {
            expect(resolveOutcome(500)).to.equal('SERVER_ERROR')
        });
        it('should return SUCCESS for any other status', () => {
            expect(resolveOutcome(301)).to.equal('SUCCESS')
        });
    });

    describe('logDownstreamCall Test', () => {
        it('should log a "downstream_http_call" structured event', () => {
            const originalLog = console.log;
            let logged;
            console.log = (msg) => { logged = msg };
            try {
                logDownstreamCall({
                    clientName: 'TestClient',
                    method: 'POST',
                    url: 'http://localhost:2773/test',
                    host: 'localhost:2773',
                    status: 200,
                    success: true,
                    outcome: 'SUCCESS',
                    durationMs: 10
                });
            } finally {
                console.log = originalLog;
            }
            const event = JSON.parse(logged);
            expect(event.eventType).to.equal('downstream_http_call');
            expect(event.clientName).to.equal('TestClient');
            expect(event.status).to.equal(200);
            expect(event.success).to.be.true;
            expect(event.outcome).to.equal('SUCCESS');
            expect(event.errorType).to.be.null;
            expect(event.errorMessage).to.be.null;
        });
    });

    describe('instrumentDownstreamCall Test', () => {
        beforeEach(() => mockServer.start(2773));
        afterEach(() => mockServer.stop());

        it('should log SUCCESS outcome and return the response on 2xx', async () => {
            mockServer.forGet('/ok').thenReply(200, '{}');
            const originalLog = console.log;
            let logged;
            console.log = (msg) => { logged = msg };
            let response;
            try {
                response = await instrumentDownstreamCall('TestClient', 'GET', 'http://localhost:2773/ok', () => fetch('http://localhost:2773/ok'));
            } finally {
                console.log = originalLog;
            }
            expect(response.status).to.equal(200);
            const event = JSON.parse(logged);
            expect(event.status).to.equal(200);
            expect(event.outcome).to.equal('SUCCESS');
            expect(event.success).to.be.true;
        });

        it('should log ERROR outcome and rethrow when the call fails', async () => {
            const expectedError = new Error('network error');
            const originalLog = console.log;
            let logged;
            console.log = (msg) => { logged = msg };
            try {
                await instrumentDownstreamCall('TestClient', 'GET', 'http://localhost:2773/ko', () => { throw expectedError });
                expect.fail('Expected instrumentDownstreamCall to throw');
            } catch (error) {
                expect(error).to.equal(expectedError);
            } finally {
                console.log = originalLog;
            }
            const event = JSON.parse(logged);
            expect(event.status).to.equal(-1);
            expect(event.outcome).to.equal('ERROR');
            expect(event.errorType).to.equal('Error');
            expect(event.errorMessage).to.equal('network error');
        });
    });
});
