exports.validatePathAndMethod = function(event){
    if(!event) {
        return false
    }
    const { path, httpMethod } = event
    if(httpMethod==='GET' && path && path.indexOf('/cn/v1/files/')===0){
        return true
    }
    return false
}

exports.respondError = function(errorDetails, statusCode, headers){
    return {
        statusCode: statusCode,
        headers,
        body: JSON.stringify(errorDetails)
    }
}

exports.getFileKeyFromPath = function(path){
  return path.replace('/cn/v1/files/', '')
}