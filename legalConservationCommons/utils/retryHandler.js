// develop a function that retryes an async function with a given number of retries
// and a given delay between retries
// the function returns a promise that resolves when the async function resolves
// or rejects when the async function rejects after the given number of retries
// the function is used to retry the call to the API when the API is not available
// the function is used in the following files:
// - legalConservationCommons/utils/api.js

const retryHandler = (asyncFunction, retries, delay) => {
    return new Promise((resolve, reject) => {
        asyncFunction()
            .then(resolve)
            .catch((error) => {
                if (retries === 0) {
                    reject(error)
                } else {
                    setTimeout(() => {
                        retryHandler(asyncFunction, retries - 1, delay).then(resolve, reject)
                    }, delay)
                }
            })
    })
}

exports.retryHandler = retryHandler