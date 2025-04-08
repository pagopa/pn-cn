const { expect } = require("chai");
const proxyquire = require("proxyquire").noPreserveCache();
const { createcSostResponseOK, createcSostResponseErr } = require("./utils.js")
const kinesisSafeStorage = require('./kinesisSafeStorage.json')
const kinesisCdc = require('./kinesisCdc.json')
const pnLegalConservationRequest = require('./pnLegalConservationRequest.json')
const documentMock = require('./pnSsDocument.json')
const sinon = require('sinon');
const { getDocument } = require("legal-conservation-commons/persistence/docRepository.js");

const putRequestTTLStub = sinon.stub();
const putHistoryItemStub = sinon.stub();
const updateHistoryItemWithResponseStub = sinon.stub();
const updateRequestStub = sinon.stub();
const putRequestStub = sinon.stub();
const ttlRepositoryStub = sinon.stub();

function proxyquireGen(typeIngest){
    return proxyquire.noCallThru().load("../app/eventProcessor.js", {
        'legal-conservation-commons': {
            historyRepository: {
                putHistoryItem: putHistoryItemStub,
                updateHistoryItemWithResponse: updateHistoryItemWithResponseStub
            },
            requestRepository: {
                getRequest: () => {
                    return {
                        Item: [pnLegalConservationRequest]
                    }
                },
                updateRequest: updateRequestStub,
                putRequest: putRequestStub
            },
            ttlRepository: {
                putRequestTTL: putRequestTTLStub
            },
            docRepository: {
                getDocument: () => {
                    return {
                        Item: [documentMock]
                    }
                }
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
        describe('processEvents kinesisCdc Testing', () => {
            processorOK = proxyquireGen("ok")
            processorUploadErr = proxyquireGen("E_UPLOAD_302")
            processorErr = proxyquireGen(null)
            beforeEach(() => {
                putRequestTTLStub.callCount = 0
                putHistoryItemStub.callCount = 0
                updateHistoryItemWithResponseStub.callCount = 0
                updateRequestStub.callCount = 0
                putRequestStub.callCount = 0
                ttlRepositoryStub.callCount = 0
            });
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
                console.error(putRequestStub.callCount)
                console.error(putRequestTTLStub.callCount)
                console.error(putHistoryItemStub.callCount)
                expect(updateRequestStub.callCount).to.be.equal(1)
                expect(putRequestTTLStub.callCount).to.be.equal(1)
                expect(putHistoryItemStub.callCount).to.be.equal(1)
            });
            it('Test safeStorageOutcome for correct safeStorageOutCome', async () => {
                const res = await processorOK.processEvents([kinesisSafeStorage], "secretId")
                expect(res.ok).to.be.an("array").that.is.not.empty
                expect(res.ok).contain(kinesisSafeStorage.kinesisSeqNumber)
                expect(putRequestStub.callCount).to.be.equal(1)
                expect(putRequestTTLStub.callCount).to.be.equal(1)
                expect(putHistoryItemStub.callCount).to.be.equal(1)
            });
            it('Test safeStorageOutcome for error E_UPLOAD_302 handle correctly', async () => {
                const res = await processorUploadErr.processEvents([kinesisSafeStorage], "secretId")
                expect(res.ok).to.be.an("array").that.is.not.empty
                expect(res.ok).contain(kinesisSafeStorage.kinesisSeqNumber)
            });
            it('Test kinesisCdc for error E_UPLOAD_302 in first retry case handle correctly', async () => {
                const res = await processorUploadErr.processEvents([kinesisCdc], "secretId")
                expect(res.ok).to.be.an("array").that.is.not.empty
                expect(res.ok).contain(kinesisCdc.kinesisSeqNumber)
                expect(putRequestTTLStub.callCount).to.be.equal(1)
            });
            it('Test kinesisCdc for error E_UPLOAD_302 in second retry case handle correctly', async () => {
                let kinesisCdcTemp = JSON.parse(JSON.stringify(kinesisCdc))
                kinesisCdcTemp.dynamodb.OldImage.retryCount.N = 1
                const res = await processorUploadErr.processEvents([kinesisCdcTemp], "secretId")
                expect(res.ok).to.be.an("array").that.is.not.empty
                expect(res.ok).contain(kinesisCdc.kinesisSeqNumber)
                expect(updateHistoryItemWithResponseStub.callCount).to.be.equal(1)
            });
            it('Test unrecognized not-valid-detail-type event workflow', async () => {
                let kinesisSafeStorageTemp = JSON.parse(JSON.stringify(kinesisSafeStorage))
                kinesisSafeStorageTemp['detail-type'] = "not-valid-detail-type"
                const res = await processorOK.processEvents([kinesisSafeStorageTemp], "secretId")
                expect(res.ok).to.be.an("array").that.is.not.empty
                expect(res.ok).contain(kinesisSafeStorageTemp.kinesisSeqNumber)
            });
            it('Test unrecognized kinesisCdc event workflow', async () => {
                const res = await processorErr.processEvents([kinesisCdc], "secretId")
                expect(res.errors).to.be.an("array").that.is.not.empty
                expect(res.errors).contain(kinesisCdc.kinesisSeqNumber)
            });
            it('Test unrecognized kinesisSafeStorage event workflow', async () => {
                const res = await processorErr.processEvents([kinesisSafeStorage], "secretId")
                expect(res.errors).to.be.an("array").that.is.not.empty
                expect(res.errors).contain(kinesisSafeStorage.kinesisSeqNumber)
            });
        });
});
