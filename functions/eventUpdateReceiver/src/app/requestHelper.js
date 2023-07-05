exports.validateRequest = function(event){
    const { path, httpMethod, body } = event
    
    const errors = []
    if(httpMethod==='POST' && path && path==='/cn/v1/events' && body){
        return true
        const jsonBody = JSON.parse(body)
        if(jsonBody.events){}
    }
    
    errors.push('Invalid path/method')
    return errors
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

function validateEvent(event){
    const errors = []
    if(!event.externalId){
        errors.push('Missing "externalId"')
    }

    if(!event.fileKey){
        errors.push('Missing "externalId"')
    }

    if(!event.status){
        errors.push('Missing "externalId"')
    }

    return errors
}

exports.validateEvents = function(body){
    const jsonBody = JSON.parse(body)

    const errors = []

    if(!jsonBody.events){
        errors.push('Missing "events" key')
        return errors
    }

    for(let i=0; i<jsonBody.events.length; i++){
        const eventErrors = validateEvent(jsonBody.events[i])
        if(eventErrors.length>0){
            errors.push('Error for event at index '+i+': '+eventErrors.join(', '))
        }
    }

    return errors
}