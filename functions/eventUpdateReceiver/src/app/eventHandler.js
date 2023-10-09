const { validateRequest, generateResponse, validateEvents, getEventsFromBody } = require('./requestHelper')
const { processEventUpdate } = require('./eventProcessor')  

exports.handleEvent = async (event) => {
    console.log('event', event)
    const isRequestValid = validateRequest(event)
    if(isRequestValid.length > 0 ){
        return generateResponse({ resultCode: '404.00', resultDescription: 'Not found', errorList: isRequestValid }, 404, {})
    }
    const eventValidationErrors = validateEvents(event.body)
    if(eventValidationErrors.length>0){
        return generateResponse({ resultCode: '400.00', resultDescription: 'Validation error', errorList: eventValidationErrors }, 400, {})
    }

    const events = getEventsFromBody(event.body)
    for(let i=0; i<events.length; i++){
        await processEventUpdate(events[i])
    }

    const okData = {
        resultCode: '200.00',
        resultDescription: 'Events received',
        errorList: []
    }
    
    return generateResponse(okData, 200, {})
};
