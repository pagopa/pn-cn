const { handleEvent } = require('./src/app/eventHandler.js');

exports.handler = async (event) => {
    console.debug(event)
    return handleEvent(event);
};