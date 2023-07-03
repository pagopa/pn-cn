const { putResponse } = require('./historyRepository')
const { deleteTtl, refreshTtl } = require('./ttlRepository')
const { putEventUpdate } = require('./kinesisClient')

function isError(event){
    return event.status!=='OK'
}

function isRetryError(event){
    return false; // TODO: identify errorCodes that triggers a retry
}

exports.processEvent = async function(event){
    const isErrorResponse = isError(event)
    // update history
    await putResponse(event, isErrorResponse)

    if(isErrorResponse){
        if(isRetryError(event)){
            // refresh ttl to retry
            await refreshTtl(event)
        } else {
            // delete ttl entity
            await deleteTtl(event)
        }
    } else {
        await deleteTtl(event)

        // put Record into Kinesis
        await putEventUpdate(event)
    }
}