const { requestRepository } = require('legal-conservation-commons')
const { putUpdateTags } = require('./safeStorageClient.js')

function isError(event){
    return event.status!=='OK'
}

function prepareBody(event) {
    let lc_external_id = event.serviceProvider ? `${event.serviceProvider}` : `COMDATA::` 
    let lc_start_date = event.statusDate
    let fileKey = event.fileKey
    const body = {
        "tags": [
        {
          "fileKey": fileKey,
          "SET": {
              "lc_external_id": [lc_external_id],
              "lc_start_date": [lc_start_date]
          }
        }
      ]
    }
    return body;
}

exports.processEvent = async function(event){
    const isErrorResponse = isError(event)
    const fileKey = event.fileKey

    if(!isErrorResponse){
        const body = prepareBody(event)
        const response = await putUpdateTags(body)
        if(response.statusCode == 200) {
            await requestRepository.deleteRequest(fileKey)
        }
        else {
            throw new Error(`Problem to update tags for fileKey ${fileKey}`)
        }
    }
    else {
        throw new Error(`Legal Conservation error failed for fileKey ${fileKey}`)
    }
}