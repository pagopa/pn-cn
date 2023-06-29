const { getPresignedUrl } = require('./safeStorageClient')
const { validateRequest, respondError, getFileKeyFromPath } = require('./requestHelper')

exports.handleEvent = async (event) => {
    const isRequestValid = validateRequest(event)
    if(!isRequestValid){
        return respondError({ error: "Invalid request", status: 400}, 400, {})
    }
    
    const fileKey = getFileKeyFromPath(event.path)
    if(!fileKey){
      return respondError({ error: "Missing fileKey", status: 400}, 400, {})
    }
    
    return getPresignedUrl(fileKey)
};
