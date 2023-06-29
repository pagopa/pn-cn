exports.validateRequest = function(event){
    const { path, httpMethod, body } = event
    
    if(httpMethod==='POST' && path && path=='/cn/v1/events' && body){
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

exports.respondOk = function(data, statusCode, headers){
    return {
        statusCode: statusCode,
        headers,
        body: JSON.stringify(data)
    }
}


exports.getEventsFromBody = function(body){
    const jsonBody = JSON.parse(body)
    return jsonBody.events || []
}