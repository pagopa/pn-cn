const { expect } = require("chai");
const proxyquire = require("proxyquire").noPreserveCache();
const { createcSostResponseOK, createcSostResponseErr } = require("./utils.js")
const kinesisSafeStorage = require('./kinesisSafeStorage.json')
const kinesisCdc = require('./kinesisCdc.json')
const pnLegalConservationRequest = require('./pnLegalConservationRequest.json')

function proxyquireGen(typeIngest){
    return proxyquire.noCallThru().load("../app/eventProcessor.js", {
        'legal-conservation-commons': {
            historyRepository: {
                putHistoryItem: () => {}
            },
            requestRepository: {
                getRequest: () => {
                    return {
                        Item: pnLegalConservationRequest
                    }
                },
                updateRequest: () => {},
                putRequest: () => {}
            },
            ttlRepository: {
                putRequestTTL: () => {}
            },
        },
        './csostClient': {
            ingestDocument: () => {
                switch(typeIngest){
                    case "ok":
                        return createcSostResponseOK("idRequest")
                    case "E_UPLOAD_302":
                        return createcSostResponseErr("E_UPLOAD_302", "Error Message", "Error")
                    default:
                        return null
                }
            }
        },
    });
}


describe('eventProcessor Testing', () => {
        const processorOK = proxyquireGen("ok")
        const processorUploadErr = proxyquireGen("E_UPLOAD_302")
        const processorErr = proxyquireGen(null)
        describe('processEvents kinesisCdc Testing', () => {
            it('Test kinesisCdc for missing OldImage kinesisCdc', async () => {
                let kinesisCdcTemp = JSON.parse(JSON.stringify(kinesisCdc))
                delete kinesisCdcTemp.dynamodb["OldImage"]
                const res = await processorOK.processEvents([kinesisCdcTemp], "secretId")
                expect(res.errors).to.be.an("array").that.is.not.empty
                expect(res.errors).contain(kinesisCdcTemp.kinesisSeqNumber)
            });
            it('Test kinesisCdc for correct kinesisCdc', async () => {
                const res = await processorOK.processEvents([kinesisCdc], "secretId")
                expect(res.ok).to.be.an("array").that.is.not.empty
                expect(res.ok).contain(kinesisCdc.kinesisSeqNumber)
            });
            it('Test safeStorageOutcome for correct safeStorageOutCome', async () => {
                const res = await processorOK.processEvents([kinesisSafeStorage], "secretId")
                expect(res.ok).to.be.an("array").that.is.not.empty
                expect(res.ok).contain(kinesisSafeStorage.kinesisSeqNumber)
            });
            it('Test safeStorageOutcome for error E_UPLOAD_302 handle correctly', async () => {
                const res = await processorUploadErr.processEvents([kinesisSafeStorage], "secretId")
                expect(res.ok).to.be.an("array").that.is.not.empty
                expect(res.ok).contain(kinesisSafeStorage.kinesisSeqNumber)
            });
            it('Test kinesisCdc for error E_UPLOAD_302 handle correctly', async () => {
                const res = await processorUploadErr.processEvents([kinesisCdc], "secretId")
                expect(res.ok).to.be.an("array").that.is.not.empty
                expect(res.ok).contain(kinesisCdc.kinesisSeqNumber)
            });
            it('Test unrecognized event workflow', async () => {
                let kinesisSafeStorageTemp = JSON.parse(JSON.stringify(kinesisSafeStorage))
                kinesisSafeStorageTemp['detail-type'] = "not-valid-detail-type"
                const res = await processorOK.processEvents([kinesisSafeStorageTemp], "secretId")
                expect(res.ok).to.be.an("array").that.is.not.empty
                expect(res.ok).contain(kinesisSafeStorageTemp.kinesisSeqNumber)
            });
            it('Test unrecognized event workflow', async () => {
                const res = await processorErr.processEvents([kinesisCdc], "secretId")
                expect(res.errors).to.be.an("array").that.is.not.empty
                expect(res.errors).contain(kinesisCdc.kinesisSeqNumber)
            });
            it('Test unrecognized event workflow', async () => {
                const res = await processorErr.processEvents([kinesisSafeStorage], "secretId")
                expect(res.errors).to.be.an("array").that.is.not.empty
                expect(res.errors).contain(kinesisSafeStorage.kinesisSeqNumber)
            });
        });
});
