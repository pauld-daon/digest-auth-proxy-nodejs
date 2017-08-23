var logger = require('../../../logger'),
    cryptoUtil = require('../cryptoUtil')

class HTTPRequestResponse {

    constructor() {
        this.constants = {
            DATE_HEADER_NAME: "Auth-Date",
            CONTENT_TYPE_HEADER_NAME: 'Content-Type',
            CONTENT_TYPE_HEADER_VALUE: 'application/json',
            CONTENT_LENGTH_HEADER_NAME: 'Content-Length',
            IDX_ORIGIN_HEADER_NAME: 'X-IdxOrigin',
            AUTHORIZATION_HEADER_NAME: 'Authorization'
        }
    }

    /**
     * Lowercase hex value of the sha256 hashed value of the request body
     * e.g. empty body: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
     * e.g. 1:          6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b
     */
    payloadHashHex() {
        var body = this.body ? this.body : ''
        return cryptoUtil.hash(body).digest('hex')
    }

    /**
     * Query string parameters sorted alphabetically by parameter name, combined with '&' characters
     * No preceding '?' character
     * e.g. limit=5&sortField=created&status=ACTIVE
     */
    sortedAndFormattedQueryString() {
        if (this.queryString.indexOf('?') > -1) {

            var result
            if (this.queryString.indexOf('&') > -1) {
                result = this.queryString
                         .replace(/\?/, '')
                         .split('&')
                         .sort()
                         .join("&")
            } else {
                result = this.queryString
                         .replace(/\?/, '')
            }
            return result
        }
        return ''
    }

    /**
     * Return new headers array sorted alphabetically based on header name (case insensitive)
     * Remove the Content-Length header if the value is 0 or undefined
     * Convert header names to lowercase
     */
    sortedHeaders() {
        // Create a headers array from the _headers object
        var headers = []
        for (var key in this.headers) {
            if (this.headers.hasOwnProperty(key)) {
                headers.push({ [key]: this.headers[key] })
            }
        }

        // Remove the Content-Length header if the value is 0 or undefined
        var self = this
        var contentLengthHeaderIndex = headers.findIndex(function (el) {
            return Object.keys(el)[0].toUpperCase() === self.constants.CONTENT_LENGTH_HEADER_NAME.toUpperCase()
        })
        if (contentLengthHeaderIndex !== -1 ) {
            var contentLengthHeaderName = Object.keys(headers[contentLengthHeaderIndex])[0]
            var contentLengthHeaderValue = headers[contentLengthHeaderIndex][contentLengthHeaderName]
            if (!contentLengthHeaderValue || contentLengthHeaderValue === '0') {
                headers.splice(contentLengthHeaderIndex, 1)
            }
        }

        // Convert header names to lowercase
        var headersRenamed = []
        for (var i = 0; i < headers.length; i++) {
            var headerName = Object.keys(headers[i])[0]
            var headerNameLC = headerName.toLowerCase()
            var headerValue = headers[i][headerName]
            
            headersRenamed.push({ [headerNameLC] : headerValue })
        }

        // Sort headers alphabetically by header name (case insensitive)
        headersRenamed.sort(function(obj1, obj2) {
            var key1 = Object.keys(obj1)[0].toUpperCase()
            var key2 = Object.keys(obj2)[0].toUpperCase()
            return key1 > key2
        })

        return headersRenamed
    }
}

module.exports = HTTPRequestResponse