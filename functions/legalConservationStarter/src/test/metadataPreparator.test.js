const { expect } = require("chai");
const { preparePayloadFromSafeStorageEvent } = require('../app/metadataPreparator.js')
const kinesisSafeStorage = require('./kinesisSafeStorage.json')

describe('Secret Manager Testing', () => {

    describe('metadataPreparator Test' , () => {
        it('generate Metadata for \"RicevutePEC\"', async () => {
            let kinesisSafeStorageTemp = JSON.parse(JSON.stringify(kinesisSafeStorage))
            kinesisSafeStorageTemp['detail'].documentType = "PN_EXTERNAL_LEGAL_FACTS"
            kinesisSafeStorageTemp['detail'].key = "PN_EXTERNAL_LEGAL_FACTS-56184aeb94d74c7093c99fb8ebfb2bb1.eml"
            kinesisSafeStorageTemp['detail'].contentType = "message/rfc822"
            const res = await preparePayloadFromSafeStorageEvent(kinesisSafeStorageTemp);
            expect(res.metadata["S_CLASSIFICAZIONE_DSC"]).to.not.be.null;
            expect(res.metadata["S_CLASSIFICAZIONE_DSC"]).to.not.be.undefined;
            expect(res.metadata["S_CLASSIFICAZIONE_DSC"]).to.equal("Piattaforma Notifiche - Ricevute PEC");
            expect(res.metadata["S_SIGILLATO_ELETTR"]).to.equal("True");
        });

        it('generate Metadata for \"RicevutePEC\" OLD', async () => {
            const res = await preparePayloadFromSafeStorageEvent(kinesisSafeStorage);
            expect(res.metadata["S_CLASSIFICAZIONE_DSC"]).to.not.be.null;
            expect(res.metadata["S_CLASSIFICAZIONE_DSC"]).to.not.be.undefined;
            expect(res.metadata["S_CLASSIFICAZIONE_DSC"]).to.equal("Piattaforma Notifiche - Ricevute PEC");

            expect(res.metadata["S_SIGILLATO_ELETTR"]).to.equal("False");
        });


        it('generate Metadata for \"AttestazioneOpponibiliATerzi\"', async () => {
            let kinesisSafeStorageTemp = JSON.parse(JSON.stringify(kinesisSafeStorage))
            kinesisSafeStorageTemp['detail'].documentType = "PN_AAR"
            kinesisSafeStorageTemp['detail'].key = "PN_AAR-56184aeb94d74c7093c99fb8ebfb2bb1.pdf"
            kinesisSafeStorageTemp['detail'].contentType = "application/pdf"
            const res = await preparePayloadFromSafeStorageEvent(kinesisSafeStorageTemp);
            expect(res.metadata["S_CLASSIFICAZIONE_DSC"]).to.not.be.null;
            expect(res.metadata["S_CLASSIFICAZIONE_DSC"]).to.not.be.undefined;
            expect(res.metadata["S_CLASSIFICAZIONE_DSC"]).to.equal("Piattaforma Notifiche - Attestazioni opponibili a terzi");
        });
        it('generate Metadata for \"RicevutePostalizzazione\"', async () => {
            let kinesisSafeStorageTemp = JSON.parse(JSON.stringify(kinesisSafeStorage))
            kinesisSafeStorageTemp['detail'].documentType = "PN_EXTERNAL_LEGAL_FACTS"
            kinesisSafeStorageTemp['detail'].key = "PN_EXTERNAL_LEGAL_FACTS-56184aeb94d74c7093c99fb8ebfb2bb1.pdf"
            kinesisSafeStorageTemp['detail'].contentType = "application/pdf"
            const res = await preparePayloadFromSafeStorageEvent(kinesisSafeStorageTemp);
            expect(res.metadata["S_CLASSIFICAZIONE_DSC"]).to.not.be.null;
            expect(res.metadata["S_CLASSIFICAZIONE_DSC"]).to.not.be.undefined;
            expect(res.metadata["S_CLASSIFICAZIONE_DSC"]).to.equal("Piattaforma Notifiche - Ricevute postalizzazione");
        });
        it('generate Metadata for \"Log\"', async () => {
            let kinesisSafeStorageTemp = JSON.parse(JSON.stringify(kinesisSafeStorage))
            kinesisSafeStorageTemp['detail'].documentType = "PN_LOGS_ARCHIVE_AUDIT5Y"
            kinesisSafeStorageTemp['detail'].key = "PN_LOGS_ARCHIVE_AUDIT5Y-56184aeb94d74c7093c99fb8ebfb2bb1.pdf"
            const res = await preparePayloadFromSafeStorageEvent(kinesisSafeStorageTemp);
            expect(res.metadata["S_CLASSIFICAZIONE_DSC"]).to.not.be.null;
            expect(res.metadata["S_CLASSIFICAZIONE_DSC"]).to.not.be.undefined;
            expect(res.metadata["S_CLASSIFICAZIONE_DSC"]).to.equal("Piattaforma Notifiche - File di log");
        });
    })
});
