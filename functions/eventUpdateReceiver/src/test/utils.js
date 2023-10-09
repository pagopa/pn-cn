exports.createEvent = function(path, httpMethod, body){
    return {
        path: path,
        httpMethod: httpMethod,
        body: body
    }
}

exports.generateEventBody = function(externalId, fileKey, status){
    return {
       "externalId": externalId,
       "fileKey": fileKey,
       "status": status
   }
}