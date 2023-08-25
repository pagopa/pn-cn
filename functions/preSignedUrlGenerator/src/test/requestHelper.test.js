const { expect } = require("chai");
const { validatePathAndMethod, respondError, getFileKeyFromPath } = require('../app/requestHelper')
const { createEvent } = require('./utils.js')

//validatePathAndMethod
describe('Request Helper Testing', () => {
    it('validation returns False if event is null', () => {
        const event = null
        expect(validatePathAndMethod(event)).to.false;
    });

    it('validation returns False if event is undefined', () => {
        const event = undefined
        expect(validatePathAndMethod(event)).to.false;
    });
    it('validation returns False if httpMethod of event is null', () => {
        const event = createEvent(null, '/cn/v1/files/');
        expect(validatePathAndMethod(event)).to.false;
    });
    it('validation returns False if path of event is null', () => {
        const event = createEvent('GET', null);
        expect(validatePathAndMethod(event)).to.false;
    });
    it('validation returns False if path is different of \'GET\'', () => {
        const event = createEvent('TEST', '/cn/v1/files/');
        expect(validatePathAndMethod(event)).to.false;
    });
    it('validation returns False if path of event is different of \'/cn/v1/files/\'', () => {
        const event = createEvent('GET', '/fake/path/');
        expect(validatePathAndMethod(event)).to.false;
    });
    it('validation returns True if event contains path \'/cn/v1/files/\' and httpMethod \'GET\'' , () => {
        const event = createEvent('GET', '/cn/v1/files/');
        expect(validatePathAndMethod(event)).to.true;
    });
});

//getFileKeyFromPath
describe('FileKey Testing', () => {
    it('Check if \'/cn/v1/files/\' has been removed from path', () => {
        const fileKey = 'PN_EXTERNAL_LEGAL_FACTS-6eb2c20cfcb44e5f9779c3b4f1a81952.pdf'
        const path = '/cn/v1/files/' + fileKey
        expect(getFileKeyFromPath(path)).to.equal(fileKey);
    });
});

describe('FileKey Testing', () => {
    it('Check if \'/cn/v1/files/\' has been removed from path', () => {
        const fileKey = 'PN_EXTERNAL_LEGAL_FACTS-6eb2c20cfcb44e5f9779c3b4f1a81952.pdf'
        const path = '/cn/v1/files/' + fileKey
        expect(response.Items).to.not.be.null;
        expect(response.Items).to.not.be.undefined;
        expect(getFileKeyFromPath(path)).to.equal(fileKey);
    });
});

describe('Respond Error Testing', () => {
    it('Check if complete response contains StatusCode', () => {
        const response = respondError({ resultCode: '400.00', resultDescription: 'Invalid request', errorList: ['Missing fileKey ']}, 400, {})
        expect(response.body).to.not.be.null;
        expect(response.Items).to.not.be.undefined;
        expect(response.statusCode).to.equal(400);
    });
    it('Check if complete response contains Body', () => {
        const response = respondError({ resultCode: '400.00', resultDescription: 'Invalid request', errorList: ['Missing fileKey ']}, 400, {})
        expect(response.body).to.not.be.undefined;
        expect(response.body).to.not.be.null;
    });
});


