// HTTP client for CSOST service (the legal conservation service)
async function ingestDocument(payload, secrets){
    //  return { id: "TEST_"+new Date().getTime()}
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
    
      console.debug('url to fetch', url)
    
      console.log('[DOWNSTREAM] Invoking external service CSost Ingestion. Waiting Sync response.')

      const res = await fetch(url, fetchOptions);
      
      console.debug('fetchOptions', fetchOptions)
      
      const data = await res.json()   
      if (res.ok) {
        console.log('INGESTION_OK', {
          res: data,
          req: fetchOptions
        })
      } else {
        const errorDescription = (data && data.code)? JSON.stringify(data):'undefined'
        console.log('[DOWNSTREAM] Service CSost Ingestion returned errors='+ errorDescription)
        console.warn('INGESTION_ERROR', {
          res: data,
          req: fetchOptions
        })
      }
      return data
    }

    exports.ingestDocument = ingestDocument