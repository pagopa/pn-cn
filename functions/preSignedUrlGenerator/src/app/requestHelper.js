exports.validatePathAndMethod = function(event){
    const { path, httpMethod } = event
    
    const errors = []

    if(httpMethod==='GET' && path && path.indexOf('/cn/v1/files/')===0){
        errors.push('Invalid path')
    }
    
    return errors
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