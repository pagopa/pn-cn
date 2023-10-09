const { getPresignedUrl } = require('./safeStorageClient')
const { validatePathAndMethod, respondError, getFileKeyFromPath } = require('./requestHelper')

exports.handleEvent = async (event) => {
  if(!validatePathAndMethod(event)){
    return respondError({ resultCode: '404.00', resultDescription: 'Not found', errorList: [] }, 404, {})
  }

  const fileKey = getFileKeyFromPath(event.path)
  if(!fileKey && fileKey == ""){
    return respondError({ resultCode: '400.00', resultDescription: 'Invalid request', errorList: ['Missing fileKey ']}, 400, {})
  }

  return getPresignedUrl(fileKey)
};
