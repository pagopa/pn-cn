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

exports.getPresignedUrl = async function(fileKey){
  
  const url = process.env.SAFESTORAGE_BASE_URL+'/v1/files/'+fileKey

  const headers = {
    'x-pagopa-safestorage-cx-id': process.env.SAFESTORAGE_CLIENT_ID,
  }  
  
  const fetchOptions = { 
    method: 'GET',
    headers: headers
  }

  console.debug('url to fetch', url)

  const res = await fetch(url, fetchOptions);
  
  console.debug('fetchOptions', fetchOptions)
  console.debug('res', res)
  console.debug('headers', Object.fromEntries(res.headers))
  
  if (res.ok) {
    const data = await getResponseBody(res)
    console.log('ok data', data)
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
    console.log('nok data', data)
    const response = {
      statusCode: res.status,
      headers: Object.fromEntries(res.headers)
    };

    if(data){
        response.body = data
    }

    console.log('Lambda nok response', response)      
    return response
  }
}