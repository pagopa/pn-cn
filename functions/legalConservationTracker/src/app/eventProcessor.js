const { requestRepository } = require('legal-conservation-commons')
const { putUpdateTags } = require('./safeStorageClient.js')

function prepareBody(event) {
    let lc_external_id = event.serviceProvider ? `${event.serviceProvider}::${event.externalId}` : `COMDATA::${event.externalId}` 
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
    const fileKey = event.fileKey

    const body = prepareBody(event)
    const response = await putUpdateTags(body)
    if(response.statusCode == 200) {
        await requestRepository.deleteRequest(fileKey)
    }
    else {
        throw new Error(`Problem to update tags for fileKey ${fileKey} - ${response}`)
    }
}