const { putEventUpdate } = require('./kinesisClient')
const { historyRepository, ttlRepository } = require('legal-conservation-commons')

function isError(event){
    return event.status!=='OK'
}

function getRetryErrorCodes(){
    const errorCodesConfig = process.env.RETRY_ERROR_CODES
    if(!errorCodesConfig){
        return []
    }

    const errorCodes = errorCodesConfig.split(',').map(i => i.trim())
    return errorCodes
}
function isRetryError(event){
    const retryErrorCodes = getRetryErrorCodes()
    return retryErrorCodes.indexOf(event.errorCode)>=0 
}

exports.processEventUpdate = async function(event){
    const isErrorResponse = isError(event)
    // update history
    await historyRepository.updateHistoryItemWithResponse(event, isErrorResponse)

    if(isErrorResponse){
        if(isRetryError(event)){
            // refresh ttl to retry
            console.log('File key '+event.fileKey +' / '+event.externalId+' received KO status with retriable error code '+event.errorCode)
            await ttlRepository.refreshRequestTTL(event)
        } else {
            // delete ttl entity
            console.log('File key '+event.fileKey +' / '+event.externalId+' received KO status with not retriable error code '+event.errorCode)
            await ttlRepository.deleteRequestTTL(event)
        }
    } else {
        console.log('File key '+event.fileKey +' / '+event.externalId+' received OK status')
        await ttlRepository.deleteRequestTTL(event)
        // put Record into Kinesis
        await putEventUpdate(event)
    }
}