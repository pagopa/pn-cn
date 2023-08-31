const { expect } = require("chai");
const { getSecret } = require('../app/secretManager.js')
const mockServer = require("mockttp").getLocal();
const { createSecretResponse } = require("./utils.js")

describe('Secret Manager Testing', () => {
    beforeEach(() => mockServer.start(2773));
    afterEach(() => mockServer.stop());

    describe('getSecret Test' , () => {
        it('Return the correct secret in the response', async () => {
            secret = 'secretName'
            secretCode = "6eb2c20cfcb44e5f9779c3b4f1a81952"
            const secretResponse = createSecretResponse(secretCode)
            mockServer.forGet('http://localhost:2773/secretsmanager/get').withExactQuery('?secretId='+ secret).thenReply(200, JSON.stringify(secretResponse))
            const res = await getSecret(secret);
            expect(res.secret).to.be.not.null;
            expect(res.secret).to.be.not.undefined;
            expect(res.secret).to.be.equal(secretCode)
        });
        it('Throw exception Error in get secret \"secret\"', async () => {
            secret = 'secretName'
            secretCode = "6eb2c20cfcb44e5f9779c3b4f1a81952"
            const secretResponse = createSecretResponse(secretCode)
            mockServer.forGet('http://localhost:2773/secretsmanager/get').withExactQuery('?secretId='+ secret).thenReply(200, JSON.stringify(null))
            try {
                const res = await getSecret(secret);
            } catch (error) {
                expect(error).to.not.be.null;
                expect(error).to.not.be.undefined;
                expect(error.message).to.equal("Error in get secret "+secret);
            }
        });
    });
});
