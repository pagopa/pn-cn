function isAttestazioneOpponibiliATerzi(event){
    return ['PN_LEGAL_FACTS', 'PN_AAR', 'PN_DOWNTIME_LEGAL_FACTS'].indexOf(event.detail.documentType)>=0
  }
  
  function isRicevutePEC(event){
    return event.detail.documentType==='PN_EXTERNAL_LEGAL_FACTS' 
            && event.detail.contentType==='message/rfc822' 
            && event.detail.client_short_code!=='pn-cons-000'
  }
  
  function isRicevutePostalizzazione(event){
    return event.detail.documentType==='PN_EXTERNAL_LEGAL_FACTS' && event.detail.contentType==='application/pdf'
  }
  
  function isLog(event){
    return ['PN_LOGS_ARCHIVE_AUDIT5Y', 'PN_LOGS_ARCHIVE_AUDIT10Y'].indexOf(event.detail.documentType)>=0
  }
  
  function getDocumentClassId(event){
    if(isAttestazioneOpponibiliATerzi(event)){
      return "1"
    } 
  
    if(isRicevutePEC(event)){
      return "2"
    }
  
    if(isRicevutePostalizzazione(event)){
      return "3"
    }
  
    if(isLog(event)){
      return "4"
    }
  
    return null
  }
  
  function getFileExtension(fileKey){
    return fileKey.split('.').pop();
  }
  
  function getMarcatoByDocumentClassId(documentClassId, documentType){
    if(documentType==='PN_AAR') return "False"

    const mapping = {
      "1": "True",
      "2": "False",
      "3": "False",
      "4": "True"
    }
  
    return mapping[documentClassId]
  }
  
  function getSigillatoElettronicamenteByDocumentClassId(documentClassId, documentType){
    if(documentType==='PN_AAR') return "False"

    const mapping = {
      "1": "True",
      "2": "True",
      "3": "True",
      "4": "True"
    }
  
    return mapping[documentClassId]
  }
  
  function getConformitaByDocumentClassId(documentClassId){
    const mapping = {
      "1": "False",
      "2": "False",
      "3": "True",
      "4": "False"
    }
  
    return mapping[documentClassId]
  }
  
  function getModalitaFormazioneByDocumentClassId(documentClassId){
    const mapping = {
      "1": "A",
      "2": "B",
      "3": "B",
      "4": "A"
    }
  
    return mapping[documentClassId]
  }
  
  function getIndiceClassificazioneByDocumentClassId(documentClassId){
    const mapping = {
      "1": "9.1",
      "2": "9.2",
      "3": "9.3",
      "4": "9.4"
    }
  
    return mapping[documentClassId]
  }

  function getClassificazioneDscByDocumentClassId(documentClassId){
    const mapping = {
      "1": "Piattaforma Notifiche - Attestazioni opponibili a terzi",
      "2": "Piattaforma Notifiche - Ricevute PEC",
      "3": "Piattaforma Notifiche - Ricevute postalizzazione",
      "4": "Piattaforma Notifiche - File di log"
    }
  
    return mapping[documentClassId]
  }

  function getMetadataFromDocumentClassId(documentClassId, event){
  
    const metadata = {
      S_MODALITA_FORMAZIONE: getModalitaFormazioneByDocumentClassId(documentClassId),
      S_TIPO_FLUSSO: 'I',
      S_AUTORE_NOMINATIVO: 'PagoPA S.p.A. / 5N2TR557',
      S_AUTORE_CODICE: '15376371009',
      S_AUTORE_TIPO_SOGGETTO: 'PAI',
      S_RISERVATO: "False",
      S_FORMATO: getFileExtension(event.detail.key),
      S_FIRMATO_DIGITALMENTE: "False",
      S_MARCATO: getMarcatoByDocumentClassId(documentClassId, event.detail.documentType),
      S_SIGILLATO_ELETTR: getSigillatoElettronicamenteByDocumentClassId(documentClassId, event.detail.documentType),
      S_CONFORMITA: getConformitaByDocumentClassId(documentClassId),
      S_INDICE_CLASSIFICAZIONE: getIndiceClassificazioneByDocumentClassId(documentClassId),
      S_CLASSIFICAZIONE_DSC: getClassificazioneDscByDocumentClassId(documentClassId),
      S_VERSIONE: "1",
      PAGOPA_DOCUMENT_ID: event.detail.key
    }
  
    return metadata
  }
  
  exports.preparePayloadFromSafeStorageEvent = function(event){
    const documentDate = event.time
    const fileKey = event.detail.key
    const documentClassId = getDocumentClassId(event)
    const metadata = getMetadataFromDocumentClassId(documentClassId, event)
  
    const payload = {
      "documentClassId": documentClassId,
      "companyId": "1",
      "signSingleDoc": false,
      "documentDate": documentDate,
      "metadata": metadata,
      "externalDocumentKey": fileKey,
      "remoteFileInfo": {
        "remoteConfigurationCode": process.env.REMOTE_CONFIGURATION_CODE, 
        "fileName": fileKey,
        "contentType": event.detail.contentType,
        "hashType": "SHA256",
        "hash": event.detail.checksum,
        "retrieveParameters": {
          "HTTP_FILE_KEY": fileKey
        },
        "notificationParameters": {
          "HTTP_FILE_KEY": fileKey
        }
      }
    }
    return payload;
  }
  