const { validateRequest, respondError, respondOk, getEventsFromBody } = require('./requestHelper')
const { processEventUpdate } = require('./eventProcessor')  

exports.handleEvent = async (event) => {
    console.log('event', event)
    const isRequestValid = validateRequest(event)
    if(!isRequestValid){
        return respondError({ resultCode: '400.00', resultDescription: 'Invalid request', errorList: [] }, 400, {})
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
    
    return respondOk(okData, 200, {})
};
