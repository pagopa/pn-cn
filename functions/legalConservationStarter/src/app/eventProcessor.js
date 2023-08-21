const { isCdcTtlRemovalEvent, isSafeStorageEvent } = require('./kinesis')

const { historyRepository, requestRepository, ttlRepository } = require('legal-conservation-commons')
const { ingestDocument } = require('./csostClient')
const { preparePayloadFromSafeStorageEvent } = require('./metadataPreparator')

const PARTITION_KEY_PREFIX = 'sla##'
const PARTITION_KEY_PREFIX_LENGTH = PARTITION_KEY_PREFIX.length

function getFileKeyFromCdcEvent(event){
  const pk = event.dynamodb.OldImage.pk.S
  
  if(pk.indexOf(PARTITION_KEY_PREFIX)===0){
    return pk.substr(PARTITION_KEY_PREFIX_LENGTH)
  }

  return null
}

async function processCdcTTLRemovalEvent(event, secrets){
  // get fileKey
  const fileKey = getFileKeyFromCdcEvent(event)
  if(!fileKey){
    console.warn('File key not found for event', event)
    return
  }

  // get existing metadata (getItem from pn-legalconservation-requests table)
  const requestItem = await requestRepository.getRequest(fileKey)
  if(!requestItem || !requestItem.Item){
    console.warn('Request item not found for file key '+fileKey)
    return
  }

  const payload = requestItem.Item.metadata
  // use the same request to payload to invoke cSOST servie
  const res = await ingestDocument(payload, secrets)

  if(res && res.id){
    const requestTimestamp = new Date()

    console.debug('Put request '+fileKey + ' ' + res.id)
    // update pn-legalconservation-requests (req and sla) with external_id and timestamp
    await requestRepository.updateRequest(fileKey, res.id, requestTimestamp)

    console.debug('Put request TTL '+fileKey + ' ' + res.id)
    await ttlRepository.putRequestTTL(fileKey, res.id, requestTimestamp)

    // put item in pn-legalconservation-requests-history
    console.debug('Put request history '+fileKey + ' ' + res.id)
    await historyRepository.putHistoryItem(fileKey, res.id, payload, requestTimestamp)

  } else if(res && res.code==='E_UPLOAD_302') {
    console.warn('File key already exists: '+fileKey, {
      res: res,
      payload: payload
    })
  } else {
    throw new Error("CSOST Service error", event)
  }
  throw new Error("Not implemented")
}

async function processSafeStorageEvent(event, secrets){
  const payload = preparePayloadFromSafeStorageEvent(event)

  if(!payload.documentClassId){
    console.info('Event skipped because of missing document class Id', event)
    return
  }

  const res = await ingestDocument(payload, secrets)
  if(res && res.id){
    const requestTimestamp = new Date()

    console.debug('Put request '+event.detail.key + ' ' + res.id)
    await requestRepository.putRequest(event.detail.key, res.id, payload, requestTimestamp)

    console.debug('Put request TTL '+event.detail.key + ' ' + res.id)
    await ttlRepository.putRequestTTL(event.detail.key, res.id, requestTimestamp) // TODO: transform in batchWriteCommand (https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/modules/_aws_sdk_util_dynamodb.html)

    console.debug('Put request history '+event.detail.key + ' ' + res.id)
    await historyRepository.putHistoryItem(event.detail.key, res.id, payload, requestTimestamp)

  } else if(res && res.code==='E_UPLOAD_302') {
    console.warn('File key already exists: '+event.detail.key, {
      res: res,
      payload: payload
    })
  } else {
    throw new Error("CSOST Service error", event)
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

    for(let i=0; i<events.length; i++){
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