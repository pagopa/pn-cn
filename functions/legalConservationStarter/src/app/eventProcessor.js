const { isCdcTtlRemovalEvent, isSafeStorageEvent } = require('./kinesis')
const { putRequest, putRequestTTL } = require('./requestRepository')
const { putHistory } = require('./historyRepository')

async function getSecretFromStore(secretName) {
    try {
      const response = await fetch(
        `http://localhost:2773/secretsmanager/get?secretId=${encodeURIComponent(
            secretName
        )}`,
        {
          headers: {
            'Content-Type': 'application/json',
            "X-Aws-Parameters-Secrets-Token": process.env.AWS_SESSION_TOKEN,
          },
        }
      );
      
      const data = await response.json()
      return data.SecretString;
    } catch (err) {
      console.error("Error in get secret ", err);
      throw new Error("Error in get secret "+secretName);
    }
}

async function invokeService(payload){
  const secret = await getSecretFromStore('pn-cn-Secrets')

  const secretAsJson = JSON.parse(secret)
  
  console.log('secret as json ', secretAsJson)

  return { id: "TEST_"+new Date().getTime()}
  const url = process.env.CONSERVATION_SERVICE_BASE_URL+'/api/v1/uploads/remote'

  const headers = {
    'x-api-key': secretAsJson.apiKey
  }  
  
  const fetchOptions = { 
    method: 'POST',
    headers: headers,
    body: JSON.stringify(payload)
  }

  console.debug('url to fetch', url)

  const res = await fetch(url, fetchOptions);
  
  console.debug('fetchOptions', fetchOptions)
  
  if (res.ok) {
    const data = await response.json()   
    console.log('INGESTION_OK', {
      res: data,
      req: fetchOptions
    })
    return data
  } else {
    const data = await response.json()   
    console.log('INGESTION_ERROR', {
      res: data,
      req: fetchOptions
    })
    return null
  }
}

async function processCdcTTLRemovalEvent(event){
  // get fileKey

  throw new Error("Not implemented")
}

function isAttestazioneOpponibiliATerzi(event){
  return ['PN_LEGAL_FACTS', 'PN_AAR', 'PN_DOWNTIME_LEGAL_FACTS'].indexOf(event.detail.documentType)>=0
}

function isRicevutePEC(event){
  return event.detail.documentType==='PN_EXTERNAL_LEGAL_FACTS' && event.detail.contentType==='application/xml'
}

function isRicevutePostalizzazione(event){
  return event.detail.documentType==='PN_EXTERNAL_LEGAL_FACTS' && event.detail.contentType!=='application/xml'
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
}

function getFileExtension(fileKey){
  return fileKey.split('.').pop();
}

function getMarcatoByDocumentClassId(documentClassId){
  const mapping = {
    "1": true,
    "2": false,
    "3": false,
    "4": true
  }

  return mapping[documentClassId]
}

function getSigillatoElettronicamenteByDocumentClassId(documentClassId){
  const mapping = {
    "1": true,
    "2": false,
    "3": true,
    "4": true
  }

  return mapping[documentClassId]
}

function getConformitaByDocumentClassId(documentClassId){
  const mapping = {
    "1": false,
    "2": false,
    "3": true,
    "4": false
  }

  return mapping[documentClassId]
}

function getMetadataFromDocumentClassId(documentClassId, event){

  const metadata = {
    S_MODALITA_FORMAZIONE: 'A',
    S_TIPO_FLUSSO: 'I',
    S_AUTORE_NOMINATIVO: 'PagoPA S.p.A.',
    S_AUTORE_CODICE: '15376371009',
    S_AUTORE_TIPO_SOGGETTO: 'PG',
    S_RISERVATO: true,
    S_FORMATO: getFileExtension(event.detail.key),
    S_FIRMATO_DIGITALMENTE: false,
    S_MARCATO: getMarcatoByDocumentClassId(documentClassId),
    S_SIGILLATO_ELETTR: getSigillatoElettronicamenteByDocumentClassId(documentClassId),
    S_CONFORMITA: getConformitaByDocumentClassId(documentClassId),
    S_VERSIONE: 1,
    PAGOPA_DOCUMENT_ID: event.detail.key
  }

  return metadata
}

function preparePayloadFromSafeStorageEvent(event){
  const documentDate = event.time
  const fileKey = event.detail.key
  const documentClassId = getDocumentClassId(event)
  const metadata = getMetadataFromDocumentClassId(documentClassId, event)

  const payload = {
    "documentClassId": documentClassId,
    "companyId": "1",
    "signSignleDoc": true,
    "documentDate": documentDate,
    "metadata": metadata,
    "externalDocumentKey": fileKey,
    "remoteFileInfo": {
      "remoteConfigurationCode": process.env.REMOTE_CONFIGURATION_CODE, 
      "fileName": fileKey,
      "contentType": event.detail.contentType,
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

async function processSafeStorageEvent(event){
  const payload = preparePayloadFromSafeStorageEvent(event)

  const res = await invokeService(payload)
  if(res){
    const requestTimestamp = new Date()

    console.debug('Put request '+event.detail.key + ' ' + res.id)
    await putRequest(event.detail.key, res.id, payload, requestTimestamp)

    console.debug('Put request TTL '+event.detail.key + ' ' + res.id)
    await putRequestTTL(event.detail.key, res.id, requestTimestamp) // TODO transform in batchWriteCommand

    console.debug('Put request history '+event.detail.key + ' ' + res.id)
    await putHistory(event.detail.key, res.id, payload, requestTimestamp)

  } else {
    throw new Error("Service error", event)
  }
}

async function processEvent(event){
    if(isCdcTtlRemovalEvent(event)){
        await processCdcTTLRemovalEvent(event)
    } else if(isSafeStorageEvent(event)) {
        await processSafeStorageEvent(event)
    } else {
        console.warn('Undetected event type', event)
    }
}

exports.processEvents = async function(events){
    const summary = {
        errors: [],
        ok: []
    }

    for(let i=0; i<events.length; i++){ // TODO: create a concurrency pool, we can't run it sequentially in production... :/
        try {
            await processEvent(events[i])
            summary.ok.push(events[i].kinesisSeqNumber)
        } catch(e){
            console.error(e)
            summary.errors.push(events[i].kinesisSeqNumber)
        }
    }

    return summary
}