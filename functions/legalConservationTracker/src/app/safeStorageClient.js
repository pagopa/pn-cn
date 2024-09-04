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

async function internalUpdateTags(url, fetchOptions){
  const res = await fetch(url, fetchOptions);
  
  if (res.ok) {
    const data = await getResponseBody(res)
    console.log('SAFESTORAGE_UPDATE_TAGS_OK', {
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
    
    console.log('Ok response', response)
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

    console.warn('Service SafeStorage updateTags returned errors', {
      res: response,
      url: url,
      req: fetchOptions
    })

    return response
  }
}

async function updateTags(body) {
  const url = `${process.env.SAFESTORAGE_BASE_URL}/v1/files/tags`
  const fetchOptions = { 
    method: 'POST',
    headers: {
      'x-pagopa-safestorage-cx-id': process.env.SAFESTORAGE_CLIENT_ID,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  }
  console.log('Invoking service SafeStorage updateTags. Waiting Sync response.', {
    url: url,
    fetchOptions: fetchOptions
  })

  return retryHandler(() => internalUpdateTags(url, fetchOptions), 3, 1000)
}

exports.putUpdateTags = updateTags
