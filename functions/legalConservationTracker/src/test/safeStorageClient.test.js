const { expect } = require("chai");
const { putUpdateTags } = require('../app/safeStorageClient.js')
const mockServer = require("mockttp").getLocal();
const port = 8080;
process.env.SAFESTORAGE_BASE_URL = "http://localhost:8080"
process.env.SAFESTORAGE_CLIENT_ID = "testing"
const fileKey = "PN_AAR-82d1ede7c974ca8ae01ca4bde136ecf.pdf"

describe('Prepare MockServer on port ' + port, () => {
    beforeEach(() => mockServer.start(port));
    afterEach(() => mockServer.stop());

    describe('update Tag Url Test ' + port, () => {
        it('update Tag  200 OK', async () => {`${process.env.SAFESTORAGE_BASE_URL}/v1/files/tags`
            const body = {
                    "tags": [
                    {
                    "fileKey": fileKey,
                    "SET": {
                        "lc_external_id": ['COMDATA::MOCK##711aeff3-1f43-4a48-8798-f268bdb23ea6'],
                        "lc_start_date": ["2023-09-25T09:26:47.380Z"]
                        }
                    }
                ]
            }
            //not completely sure of request output
            mockServer.forPost(`/v1/files/tags`).thenReply(200)
            const res = await putUpdateTags(body);
            const statusCode = JSON.parse(res.statusCode)
            expect(statusCode).to.be.equal(200)
        });

        it('update Tag 400 Bad request', async () => {
            const body = {
                    "tags": [
                    {
                    "fileKey": fileKey,
                    "SET": {
                        "lc_external_id": ['COMDATA::MOCK##711aeff3-1f43-4a48-8798-f268bdb23ea6'],
                        "lc_start_date": ["2023-09-25T09:26:47.380Z"]
                        }
                    }
                ]
            }
            mockServer.forPost(`/v1/files/tags`).thenReply(400, 'Bad request')

            const res = await putUpdateTags(body);
            const statusCode = JSON.parse(res.statusCode)
            expect(statusCode).to.be.equal(400)
        });
    });

});
