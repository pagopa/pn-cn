exports.createEvent = function(httpMethod, path){
    return {
        path: path,
        httpMethod: httpMethod
    }
}

