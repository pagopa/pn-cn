// Reproduces the structured "downstream_http_call" log event emitted by
// pn-commons' DownstreamCallLoggingFilter (Java), so that downstream HTTP
// calls performed by Node.js lambdas are observable in the same way.

const EVENT_TYPE = 'downstream_http_call'

const resolveOutcome = (status) => {
    if (status >= 200 && status < 300) return 'SUCCESS'
    if (status >= 400 && status < 500) return 'CLIENT_ERROR'
    if (status >= 500) return 'SERVER_ERROR'
    return 'SUCCESS'
}

// AWS Lambda exposes the X-Ray trace context as "Root=...;Parent=...;Sampled=..."
const extractTraceContext = () => {
    const raw = process.env._X_AMZN_TRACE_ID
    if (!raw) return { traceId: null, spanId: null }
    const parts = Object.fromEntries(raw.split(';').map((entry) => entry.split('=')))
    return { traceId: parts.Root || null, spanId: parts.Parent || null }
}

const logDownstreamCall = ({ clientName, method, url, host, status, success, outcome, durationMs, errorType, errorMessage }) => {
    const { traceId, spanId } = extractTraceContext()
    const event = {
        eventType: EVENT_TYPE,
        timestamp: new Date().toISOString(),
        clientName,
        method,
        url,
        host,
        status,
        success,
        outcome,
        durationMs,
        traceId,
        spanId,
        errorType: errorType || null,
        errorMessage: errorMessage || null
    }
    console.log(JSON.stringify(event))
}

// Wraps the invocation of a downstream HTTP call (e.g. fetch), timing it and
// logging the outcome. On error the original error is rethrown untouched.
const instrumentDownstreamCall = async (clientName, method, url, invokeFetch) => {
    const startNano = process.hrtime.bigint()
    const host = new URL(url).host
    try {
        const response = await invokeFetch()
        const durationMs = Number((process.hrtime.bigint() - startNano) / 1000000n)
        const status = response.status
        const success = status >= 200 && status < 300
        logDownstreamCall({ clientName, method, url, host, status, success, outcome: resolveOutcome(status), durationMs })
        return response
    } catch (error) {
        const durationMs = Number((process.hrtime.bigint() - startNano) / 1000000n)
        logDownstreamCall({
            clientName,
            method,
            url,
            host,
            status: -1,
            success: false,
            outcome: 'ERROR',
            durationMs,
            errorType: error.constructor.name,
            errorMessage: error.message || 'unknown'
        })
        throw error
    }
}

module.exports = {
    logDownstreamCall,
    instrumentDownstreamCall,
    resolveOutcome
}
