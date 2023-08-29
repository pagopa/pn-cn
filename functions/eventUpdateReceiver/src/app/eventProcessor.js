const { putEventUpdate } = require('./kinesisClient')
const { historyRepository, ttlRepository } = require('legal-conservation-commons')

function isError(event){
    return event.status!=='OK'
}

function isRetryError(event){
    return false; // TODO: identify errorCodes that triggers a retry
}

exports.processEventUpdate = async function(event){
    const isErrorResponse = isError(event)
    // update history
    await historyRepository.updateHistoryItemWithResponse(event, isErrorResponse)

    if(isErrorResponse){
        if(isRetryError(event)){
            // refresh ttl to retry
            await ttlRepository.refreshRequestTTL(event)
        } else {
            // delete ttl entity
            await ttlRepository.deleteRequestTTL(event)
        }
    } else {
        await ttlRepository.deleteRequestTTL(event)
        // put Record into Kinesis
        await putEventUpdate(event)
    }
}