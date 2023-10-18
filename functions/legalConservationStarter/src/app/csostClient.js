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
    
      console.log('[DOWNSTREAM] Invoking external service CSost Ingestion. Waiting Sync response.', {
        url: url,
        fetchOptions: fetchOptions
      })

      const res = await fetch(url, fetchOptions);
        
      const data = await res.json()   
      if (res.ok) {
        console.log('INGESTION_OK', {
          res: data,
          req: fetchOptions
        })
      } else {
        console.warn('[DOWNSTREAM] Service CSost Ingestion returned errors', {
          res: data,
          req: fetchOptions
        })
      }
      return data
    }

    exports.ingestDocument = ingestDocument