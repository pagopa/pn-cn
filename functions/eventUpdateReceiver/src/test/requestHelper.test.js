const { expect } = require("chai");
const { validateRequest, generateResponse, validateEvents, getEventsFromBody } = require('../app/requestHelper')
const { createEvent, generateEventBody } = require('./utils.js')

function checkInvalidMethodPath(result){
    expect(result).to.not.be.null;
    expect(result).to.not.be.undefined;
    expect(result).to.include.members(['Invalid path/method']);
}

//validateRequest
describe('Request Helper Testing', () => {
    describe('validateRequest Testing', () => {
        it('validateRequest returns True with correct event', () => {
            const event = createEvent('/cn/v1/events', 'POST', {})
            const res = validateRequest(event);
            expect(res).to.not.be.null;
            expect(res).to.not.be.undefined;
            expect(res).to.be.an("array").that.is.empty
        });

        it('validateRequest returns \'Invalid path/method\' if event path is invalid', () => {
            const event = createEvent('/fake/path', 'POST', {})
            const result = validateRequest(event);
            checkInvalidMethodPath(result)
        });

        it('validateRequest returns \'Invalid path/method\' if event path is null', () => {
            const event = createEvent(null, 'POST', {})
            const result = validateRequest(event);
            checkInvalidMethodPath(result)
        });

        it('validateRequest returns \'Invalid path/method\' if httpMethod is invalid', () => {
            const event = createEvent('/cn/v1/events', 'GET', {})
            const result = validateRequest(event);
            checkInvalidMethodPath(result)
        });

        it('validateRequest returns \'Invalid path/method\' if body is null', () => {
            const event = createEvent('/cn/v1/events', 'POST', null)
            const result = validateRequest(event);
            checkInvalidMethodPath(result)
        });
    });

    //generateResponse
    describe('generateResponse Testing', () => {
        it('Check if generateResponse returns StatusCode', () => {
            const response = generateResponse({ resultCode: '400.00', resultDescription: 'Invalid request', errorList: ['Missing fileKey ']}, 400, {});
            expect(response.statusCode).to.not.be.null;
            expect(response.statusCode).to.not.be.undefined;
            expect(response.statusCode).to.equal(400);
        });

        it('Check if generateResponse returns headers', () => {
            const response = generateResponse({ resultCode: '400.00', resultDescription: 'Invalid request', errorList: ['Missing fileKey ']}, 400, {});
            expect(response.headers).to.not.be.null;
            expect(response.headers).to.not.be.undefined;
            expect(response.headers).to.deep.equal({});
        });

        it('Check if generateResponse returns body', () => {
            const response = generateResponse({ resultCode: '400.00', resultDescription: 'Invalid request', errorList: ['Missing fileKey ']}, 400, {});
            expect(response.body).to.not.be.null;
            expect(response.body).to.not.be.undefined;
            expect(JSON.parse(response.body).resultDescription).to.equal('Invalid request');
        });
    });

    //validateEvents
    describe('validateEvents Testing', () => {
        it('Check if validateEvents is ok when body is right', () => {
            body = {
                events: []
            }
            for (let i = 0; i < 3; i++) {
                body.events.push(generateEventBody('PN_EXTERNAL_LEGAL_FACTS', 'PN_EXTERNAL_LEGAL_FACTS-6eb2c20cfcb44e5f9779c3b4f1a81952.pdf','SAVED'))
            }
            const response = validateEvents(JSON.stringify(body));
            expect(response).to.not.be.null;
            expect(response).to.not.be.undefined;
            expect(response).to.be.an("array").that.is.empty
        });

        it('Check if validateEvents returns Errors Array', () => {
            body = {
                events: [
                    generateEventBody('PN_EXTERNAL_LEGAL_FACTS', 'PN_EXTERNAL_LEGAL_FACTS-6eb2c20cfcb44e5f9779c3b4f1a81952.pdf',''),
                    generateEventBody('', 'PN_EXTERNAL_LEGAL_FACTS-6eb2c20cfcb44e5f9779c3b4f1a81952.pdf','SAVED'),
                    generateEventBody('PN_EXTERNAL_LEGAL_FACTS', '','SAVED')
                ]
            }
            const response = validateEvents(JSON.stringify(body));
            expect(response).to.not.be.null;
            expect(response).to.not.be.undefined;
            expect(response).to.be.an("array").that.is.not.empty
        });

        it('Check if validateEvents returns \'Missing "events" key\' if events is empty', () => {
            body = {}
            const response = validateEvents(JSON.stringify(body));
            expect(response).to.not.be.null;
            expect(response).to.not.be.undefined;
            expect(response).to.be.an("array")
            expect(response).that.is.not.empty
            expect(response[0]).to.equal('Missing "events" key')
        });
    });

    //getEventsFromBody
    describe('getEventsFromBody Testing', () => {
        it('Check if getEventsFromBody return event array', () => {
            body = {
                events: []
            }
            for (let i = 0; i < 3; i++) {
                body.events.push(generateEventBody('PN_EXTERNAL_LEGAL_FACTS', 'PN_EXTERNAL_LEGAL_FACTS-6eb2c20cfcb44e5f9779c3b4f1a81952.pdf','SAVED'))
            }
            const response = getEventsFromBody(JSON.stringify(body));
            expect(response).to.not.be.null;
            expect(response).to.not.be.undefined;
            expect(response).to.be.an("array").that.is.not.empty
        });

        it('Check if getEventsFromBody return [] if body is empty', () => {
                    body = {}
                    const response = getEventsFromBody(JSON.stringify(body));
                    expect(response).to.not.be.null;
                    expect(response).to.not.be.undefined;
                    expect(response).to.be.an("array").that.is.empty
                });
    });
});



