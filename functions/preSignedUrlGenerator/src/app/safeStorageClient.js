// import retryHandler from pn-legal-conservation-commons
const { retryHandler } = require('legal-conservation-commons')

async function getResponseBody(response){
    if(!response.body){
        return null;
    }
    const contentType = response.headers.get("content-type");
    console.log('Content Type', contentType)
    if (contentType && contentType.toLowerCase().indexOf("application/json") !== -1) {
        const data = await response.json()   
        return JSON.stringify(data)
    }
    
    const data = await response.text()
    return data
}

async function internalGetPresignedUrl(url, fetchOptions){
  const res = await fetch(url, fetchOptions);
  
  if (res.ok) {
    const data = await getResponseBody(res)
    console.log('SAFESTORAGE_PRESIGNED_OK', {
      res: data,
      url: url,
      req: fetchOptions
    })

    const response = {
      statusCode: res.status,
      headers: Object.fromEntries(res.headers)
    };
    
    if(data){
        response.body = data
    }
    
    console.log('Lambda ok response', response)
    return response
  } else {
    const data = await getResponseBody(res)

    const response = {
      statusCode: res.status,
      headers: Object.fromEntries(res.headers)
    };

    if(data){
        response.body = data
    }

    console.warn('Service SafeStorage preSignedlUrl returned errors', {
      res: response,
      url: url,
      req: fetchOptions
    })

    return response
  }
}

async function preSignedUrl(fileKey) {
  const url = process.env.SAFESTORAGE_BASE_URL+'/v1/files/'+fileKey

  const headers = {
    'x-pagopa-safestorage-cx-id': process.env.SAFESTORAGE_CLIENT_ID,
  }  

  const fetchOptions = { 
    method: 'GET',
    headers: headers
  }

  console.log('Invoking service SafeStorage preSignedlUrl. Waiting Sync response.', {
    url: url,
    fetchOptions: fetchOptions
  })

  return retryHandler(() => internalGetPresignedUrl(url, fetchOptions), 3, 1000)
}

exports.getPresignedUrl = preSignedUrl
