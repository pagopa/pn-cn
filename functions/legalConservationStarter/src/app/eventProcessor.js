const { isCdcTtlRemovalEvent, isSafeStorageEvent } = require('./kinesis')
const { putRequest, putRequestTTL } = require('./requestRepository')
const { putHistory } = require('./historyRepository')

async function invokeService(payload, secrets){
//  return { id: "TEST_"+new Date().getTime()}
  const url = process.env.CONSERVATION_SERVICE_BASE_URL+'/api/v1/uploads/remote'

  const headers = {
    'x-api-key': secrets.apiKey,
    'Content-Type': 'application/json'
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
    const data = await res.json()   
    console.log('INGESTION_OK', {
      res: data,
      req: fetchOptions
    })
    return data
  } else {
    const data = await res.json()   
    console.log('INGESTION_ERROR', {
      res: data,
      req: fetchOptions
    })
    return data
  }
}

async function processCdcTTLRemovalEvent(event, secrets){
  // get fileKey

  throw new Error("Not implemented")
}

function isAttestazioneOpponibiliATerzi(event){
  return ['PN_LEGAL_FACTS', 'PN_AAR', 'PN_DOWNTIME_LEGAL_FACTS'].indexOf(event.detail.documentType)>=0
}

function isRicevutePEC(event){
  return event.detail.documentType==='PN_EXTERNAL_LEGAL_FACTS' && event.detail.contentType==='application/xml' && event.detail.client_short_code!=='pn-cons-000'
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
    "1": "True",
    "2": "False",
    "3": "False",
    "4": "True"
  }

  return mapping[documentClassId]
}

function getSigillatoElettronicamenteByDocumentClassId(documentClassId){
  const mapping = {
    "1": "True",
    "2": "False",
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
    S_MARCATO: getMarcatoByDocumentClassId(documentClassId),
    S_SIGILLATO_ELETTR: getSigillatoElettronicamenteByDocumentClassId(documentClassId),
    S_CONFORMITA: getConformitaByDocumentClassId(documentClassId),
    S_VERSIONE: "1",
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

async function processSafeStorageEvent(event, secrets){
  const payload = preparePayloadFromSafeStorageEvent(event)

  const res = await invokeService(payload, secrets)
  if(res && res.id){
    const requestTimestamp = new Date()

    console.debug('Put request '+event.detail.key + ' ' + res.id)
    await putRequest(event.detail.key, res.id, payload, requestTimestamp)

    console.debug('Put request TTL '+event.detail.key + ' ' + res.id)
    await putRequestTTL(event.detail.key, res.id, requestTimestamp) // TODO: transform in batchWriteCommand (https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/modules/_aws_sdk_util_dynamodb.html)

    console.debug('Put request history '+event.detail.key + ' ' + res.id)
    await putHistory(event.detail.key, res.id, payload, requestTimestamp)

  } else if(res && res.code==='E_UPLOAD_302') {
    console.warn('File key already exists: '+event.detail.key, {
      res: res,
      payload: payload
    })
  } else {
    throw new Error("Service error", event)
  }
}

async function processEvent(event, secrets){
    if(isCdcTtlRemovalEvent(event)){
        await processCdcTTLRemovalEvent(event, secrets)
    } else if(isSafeStorageEvent(event)) {
        await processSafeStorageEvent(event, secrets)
    } else {
        console.warn('Undetected event type', event)
    }
}

exports.processEvents = async function(events, secrets){
    const summary = {
        errors: [],
        ok: []
    }

    for(let i=0; i<events.length; i++){ // TODO: create a concurrency pool, we can't run it sequentially in production... :/
        try {
            await processEvent(events[i], secrets)
            summary.ok.push(events[i].kinesisSeqNumber)
        } catch(e){
            console.error(e)
            summary.errors.push(events[i].kinesisSeqNumber)
        }
    }

    return summary
}