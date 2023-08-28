exports.validateRequest = function(event){
    const { path, httpMethod, body } = event
    const errors = []
    if(httpMethod==='POST' && path && path==='/cn/v1/events' && body){
        return true
    }
    
    errors.push('Invalid path/method')
    return errors
}

exports.generateResponse = function(errorDetails, statusCode, headers){
    return {
        statusCode: statusCode,
        headers,
        body: JSON.stringify(errorDetails)
    }
}

exports.getEventsFromBody = function(body){
    const jsonBody = JSON.parse(body)
    return jsonBody.events || []
}

function validateEvent(event){
    const errors = []
    if(!event.externalId && event.externalId === ''){
        errors.push('Missing "externalId"')
    }

    if(!event.fileKey && event.fileKey === ''){
        errors.push('Missing "fileKey"')
    }

    if(!event.status && event.status === ''){
        errors.push('Missing "status"')
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