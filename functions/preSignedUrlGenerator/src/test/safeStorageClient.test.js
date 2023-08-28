const { expect } = require("chai");
const { getResponseBody, getPresignedUrl } = require('../app/safeStorageClient.js')
const mockServer = require("mockttp").getLocal();
const mockResponse = require("./mockResponse.json");
const port = 8080;
process.env.SAFESTORAGE_BASE_URL = "http://localhost:8080"
process.env.SAFESTORAGE_CLIENT_ID = "testing"

describe('Prepare MockServer on port ' + port, () => {
    beforeEach(() => mockServer.start(port));
    afterEach(() => mockServer.stop());

    describe('getPresigned Url Test ' + port, () => {
        it('Presigned URL 200 OK', async () => {
            presignedurldemo = 'https://presignedurldemo.s3.eu-west-2.amazonaws.com/'
            mockServer.forGet('/v1/files/PN_EXTERNAL_LEGAL_FACTS-6eb2c20cfcb44e5f9779c3b4f1a81952.pdf').thenReply(200, JSON.stringify(mockResponse))
            const res = await getPresignedUrl('PN_EXTERNAL_LEGAL_FACTS-6eb2c20cfcb44e5f9779c3b4f1a81952.pdf');
            const body = JSON.parse(res.body)
            expect(body.download.url).to.be.equal(presignedurldemo)
        });

        it('Presigned URL 404 Not Found', async () => {
            presignedurldemo = 'https://presignedurldemo.s3.eu-west-2.amazonaws.com/'
            mockServer.forGet('/v1/files/PN_EXTERNAL_LEGAL_FACTS-6eb2c20cfcb44e5f9779c3b4f1a81952.pdf').thenReply(404, "Not Found")
            const res = await getPresignedUrl('PN_EXTERNAL_LEGAL_FACTS-6eb2c20cfcb44e5f9779c3b4f1a81952.pdf');
            console.lo
            expect(res.statusCode).to.be.equal(404)
        });
    });
});
