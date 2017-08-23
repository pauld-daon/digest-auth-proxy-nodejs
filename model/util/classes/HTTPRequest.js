var url = require('url'),
    logger = require('../../../logger'),
    config = require('../../../config/config'),
    cryptoUtil = require('../cryptoUtil'),
    HTTPRequestResponse = require('./HTTPRequestResponse')

class HTTPRequest extends HTTPRequestResponse {

    /**
     * @param {*} method 
     * @param {*} resourcePathAndQS 
     * @param {*} body 
     */
    constructor(method, resourcePathAndQS, body) {
        super()
        this.date = new Date()
        this.method = method
        this.body = body
        this.headers = {}

        /**
         * Set host, port, href & resourcePath based on credential.properties file
         */
        // Remove first '/'
        var pathOnly = resourcePathAndQS.substring(1)
        
        if (pathOnly.indexOf('?') > -1) {
            this.queryString = '?' + pathOnly.split('?')[1]
            pathOnly = pathOnly.split('?')[0]
        } else {
            this.queryString = '?'
        }

        var ixUrl = url.parse(url.parse(config.identityx.serviceUrl).protocol +'//'+ url.parse(config.identityx.serviceUrl).host)
        this.href = ixUrl.href + pathOnly

        this.resourcePath = ixUrl.path + pathOnly
        this.resourcePath = this.resourcePath.replace(/([^:]\/)\/+/g, "$1") // remove any double slashes

        // Set date/timestamps
        this.timestamp = this.getTimestamp()
        this.datestamp = this.getDatestamp()

        // Set nonce
        this.nonce = cryptoUtil.guid()
    }

    /**
     * Request date in the format: yyyyMMdd'T'HHmmss'Z'
     * e.g. 20170817T064553Z
     */
    getTimestamp() {
        return this.date.toISOString().replace(/-/g, '').replace(/:/g, '').replace(/\..+/, '') + 'Z'
    }

    /**
     * Request date in the format: yyyyMMdd
     * e.g. 20170816
     */
    getDatestamp() {
        if (this.getTimestamp()) {
            return this.getTimestamp().split('T')[0]
        } else {
            logger.error('Unable to get datestamp from timestamp')
            return null
        }
    }

    /**
     * Set the Auth-Date header in UTC in the format: yyyyMMdd'T'HHmmss'Z'
     * e.g. 20170816T040947Z
     */
    setAuthDateHeader() {
        this.headers[this.constants.DATE_HEADER_NAME] = this.timestamp
    }

    /**
     * Set the Content-Type header
     */
    setContentTypeHeader() {
        this.headers[this.constants.CONTENT_TYPE_HEADER_NAME] = this.constants.CONTENT_TYPE_HEADER_VALUE
    }

    /**
     * Set the X-IdxOrigin header
     */
    setIdxOriginHeader() {
        var resourceUrl = this.canonicalResourceUrl()
        this.headers[this.constants.IDX_ORIGIN_HEADER_NAME] = resourceUrl
    }

    setAuthorizationHeader(digestAuthHeaderValue) {
        this.headers[this.constants.AUTHORIZATION_HEADER_NAME] = digestAuthHeaderValue
    }

    /**
     * Lowercase hex value of the sha256 hashed value of a string containing the request method, resource path, query string,
     * headers and hashed body in a specific format
     * e.g. 977fb90c40eac10d8ffc196fa0b38248163f070e13c4d7c5789bdd593674f69e
     */
    canonicalRequestHashHex() {
        var hex = cryptoUtil.hash(this.canonicalRequestString()).digest('hex')

        logger.debug('canonicalRequestHashHex\n', hex)
        
        return hex
    }

    /**
     * Semi-colon separated list of lowercase header names
     * Sorted alphabetically by header name (case insensitive)
     * Remove the Content-Length header if the value is 0 or undefined
     * e.g. auth-date;content-type;x-idxorigin
     */
    signedHeadersString() {
        var headers = this.sortedHeaders()

        var result = ''
        headers.forEach(function(param) {
            result += Object.keys(param)[0]+ ';'
        })

        result = result.slice(0, -1)
        return result
    }

    /***************************************************************
     * PRIVATE METHODS
     ***************************************************************/

    /**
     * String containing the request method, resource path, query string,
     * headers and hashed body in a specific format
     * e.g.
     *  GET
     *  /kiwibank/IdentityXServices/rest/v1/users/
     *  limit=5&sortField=created&status=ACTIVE
     *  auth-date:20170817T032140Z
     *  content-type:application/json
     *  x-idxorigin:https://kiwibank-dia.identityx-cloud.com/kiwibank/IdentityXServices/rest/v1/users/

     *  auth-date;content-type;x-idxorigin
     *  e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
     */
    canonicalRequestString() {
        var result = this.method + '\n' +
                     this.resourcePath + '\n' +
                     this.sortedAndFormattedQueryString() + '\n' +
                     this.canonicalHeadersString() + '\n' +
                     this.signedHeadersString() + '\n' +
                     this.payloadHashHex()
        
        logger.debug('canonicalRequestString\n', result)
        
        return result
    }

    /**
     * Header names (lowercase) and values combined with colons, separated by newlines (with a newline at the end)
     * Sorted alphabetically by header name (case insensitive)
     * Remove the Content-Length header if the value is 0 or undefined
     * e.g. 
     *  auth-date:20170816T061815Z
     *  content-type:application/json
     *  x-idxorigin:https://kiwibank-dia.identityx-cloud.com/kiwibank/IdentityXServices/rest/v1/users/
     */
    canonicalHeadersString() {
        var headers = this.sortedHeaders()
        
        // Combine headers with a colon, separated by new lines, and convert all header names to lowercase
        var result = ''
        headers.forEach(function(h) {
            var headerName = Object.keys(h)[0]
            var headerValue = h[Object.keys(h)[0]]
            result += headerName + ':' + headerValue + '\n'
        })

        return result
    }

    /**
     * Fully qualified URL for the resource with the protocol, hostname and path (with URL-encoded spaces)
     * e.g. https://kiwibank-dia.identityx-cloud.com/kiwibank/IdentityXServices/rest/v1/users/
     */
    canonicalResourceUrl() {
        // URL encode any spaces
        var result = this.href.replace(/ /g, '%20')

        return result
    }
}

module.exports = HTTPRequest