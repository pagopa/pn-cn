const { retryHandler, instrumentDownstreamCall } = require('legal-conservation-commons')

const CLIENT_NAME = 'CsostClient'

// HTTP client for CSOST service (the legal conservation service)
async function internalIngestDocument(url, fetchOptions){
  try {
    // logs a "downstream_http_call" event, mirroring pn-commons' DownstreamCallLoggingFilter
    const res = await instrumentDownstreamCall(CLIENT_NAME, fetchOptions.method, url, () => fetch(url, fetchOptions));

    const data = await res.json()
    if (res.ok) {
      console.log('INGESTION_OK', {
        res: data
      })
    } else {
      console.warn('[DOWNSTREAM] Service CSost Ingestion returned errors', {
        res: data
      })
    }
    return data
  } catch (error) {
    console.warn('[DOWNSTREAM] Service CSost Ingestion returned errors', {
      error: error.message,
      url: url
    })
    throw error
  }
}

// reuse retryHandler to do internalIngestDocument calls (3 retryes with 1000ms delay)
exports.ingestDocument = async function ingestDocument(payload, secrets){
  const url = process.env.CONSERVATION_SERVICE_BASE_URL+'/api/v1/uploads/remote'

  const headers = {
    'x-api-key': secrets.apiKey,
    'Content-Type': 'application/json'
  }  
  
  const fetchOptions = { 
    method: 'POST',
    headers: headers,
    body: JSON.stringify(payload)
  }

  console.log('[DOWNSTREAM] Invoking external service CSost Ingestion. Waiting Sync response.', {
    url: url,
    fetchOptions: fetchOptions
  })

  return retryHandler(() => internalIngestDocument(url, fetchOptions), 3, 1000)
}