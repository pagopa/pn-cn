// basic event
const { expect } = require("chai");
const { createEvent, generateEventBody } = require('./utils.js')
const { handleEvent } = require("../app/eventHandler.js");
const proxyquire = require("proxyquire").noPreserveCache();
const mockResponse = require("./mockResponse.json");
const conservationEvent = require("./conservationEvent.json");

describe('EventHandler Testing', () => {
    describe('handleEvent Testing', () => {
        it('should return 404 when httpMethod/path isn\'t right', async () => {
            const event = createEvent('/cn/v1/events', 'GET', JSON.stringify({"events": conservationEvent}))
            const res = await handleEvent(event)
            expect(res).to.not.be.null;
            expect(res).to.not.be.undefined;
            expect(res.statusCode).to.equal(404);
        });

        it('should return 400 when body isn\'t right', async () => {
            const event = createEvent('/cn/v1/events', 'POST', JSON.stringify({"events": [generateEventBody('', 'PN_EXTERNAL_LEGAL_FACTS-6eb2c20cfcb44e5f9779c3b4f1a81952.pdf','SAVED')]}))
            const res = await handleEvent(event)
            expect(res).to.not.be.null;
            expect(res).to.not.be.undefined;
            expect(res.statusCode).to.equal(400);
        });

        it('should return 200 when body is right', async () => {
            const lambda = proxyquire.noCallThru().load("../app/eventHandler.js", {
              "./eventProcessor": {
                    processEventUpdate: () => {},
              },
            });
            const event = createEvent('/cn/v1/events', 'POST', JSON.stringify({"events": [conservationEvent]}))
            const res = await lambda.handleEvent(event)
            expect(res).to.not.be.null;
            expect(res).to.not.be.undefined;
            expect(res.statusCode).to.equal(200);
        });
    });
});
