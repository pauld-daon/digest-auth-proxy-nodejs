var logger = require('../../../logger'),
    cryptoUtil = require('../cryptoUtil'),
    HTTPRequestResponse = require('./HTTPRequestResponse')

class HTTPResponse extends HTTPRequestResponse {

    /**
     * @param {*} date 
     * @param {*} status 
     * @param {*} headers 
     * @param {*} body 
     */
    constructor(date, status, headers, body, tokenId, nonce) {
        super()
        this.date = date
        this.status = status
        this.headers = headers
        this.body = body
        this.tokenId = tokenId
        this.nonce = this.getNonce()

        // Set date/timestamps
        this.timestamp = this.getTimestamp()
        this.datestamp = this.getDatestamp()
    }

    /**
     * Request date in the format: yyyyMMdd'T'HHmmss'Z' from the response Auth-Date header
     * e.g. 20170817T064553Z
     */
    getTimestamp() {
        var authDateValue = this.headers[this.constants.DATE_HEADER_NAME.toLowerCase()]
        return authDateValue
    }

    /**
     * Request date in the format: yyyyMMdd from the response Auth-Date header
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
     * Lowercase hex value of the sha256 hashed value of a string containing the request method, resource path, query string,
     * headers and hashed body in a specific format
     * e.g. 977fb90c40eac10d8ffc196fa0b38248163f070e13c4d7c5789bdd593674f69e
     */
    canonicalResponseHashHex() {
        var hex = cryptoUtil.hash(this.canonicalResponseString()).digest('hex')

        logger.debug('canonicalResponseHashHex\n', hex)
        
        return hex
    }

    /**
     * Digest signature from the Authorization header
     */
    responseSignature() {
        if (this.getAuthHeaderValue() && this.getAuthHeaderValue().split('digestSignature=').length == 2) {
            return this.getAuthHeaderValue().split('digestSignature=')[1]
        }
    }

    /***************************************************************
     * PRIVATE METHODS
     ***************************************************************/

    /**
     * String containing the request method, resource path, query string,
     * headers (based on authorization header) and hashed body in a specific format
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
    canonicalResponseString() {
        var result = this.status + '\n' +
                     this.canonicalHeadersString() + '\n' +
                     this.signedHeadersString() + '\n' +
                     this.payloadHashHex()
        
        logger.debug('canonicalResponseString\n', result)
        
        return result
    }

    /**
     * Nonce from the Authorization header
     */
    getNonce() {
        if (this.getAuthHeaderValue() && this.getAuthHeaderValue().split('/').length == 4) {
            return this.getAuthHeaderValue().split('/')[2]
        }
    }

    /**
     * Header names (lowercase) and values combined with colons, separated by newlines (with a newline at the end)
     * Sorted alphabetically by header name (case insensitive)
     * Based on the authorization header
     * e.g. 
     *  auth-date:20170816T061815Z
     *  content-type:application/json
     *  x-idxorigin:https://kiwibank-dia.identityx-cloud.com/kiwibank/IdentityXServices/rest/v1/users/
     */
    canonicalHeadersString() {
        var headers = this.signedHeaders()
        
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
     * Get the relevant headers as an array based on the authorization header
     * @param {*} fullHeaders 
     */
    signedHeaders() {
        if (!this.signedHeadersString()) return null
        
        var headers = []

        var headerNames = this.signedHeadersString().split(';')
        if (headerNames) {
            var self = this
            headerNames.forEach(function(key) {
                headers.push({ [key]: self.headers[key] })
            })
            return headers
        } else {
            logger.error('Could not retrieve headerNames')
            return null
        }
    }

    /**
     * Semi-colon separated list of lowercase header names
     * Sorted alphabetically by header name (case insensitive)
     * Based on the authorization header
     * e.g. auth-date;content-type;x-idxorigin
     */
    signedHeadersString() {
        if (this.getAuthHeaderValue() &&
            this.getAuthHeaderValue().split('digestSignedHeaders=').length == 2 &&
            this.getAuthHeaderValue().split(', digestSignature=').length == 2) {

            var result = this.getAuthHeaderValue().split('digestSignedHeaders=')[1].split(', digestSignature=')[0]
            return result
        } else {
            logger.error('Unable to retrieve signed headers string from authorization header')
            return null
        }
    }

    /**
     * Retrieve the Authorization header value
     */
    getAuthHeaderValue() {
        var authHeaderValue = this.headers[this.constants.AUTHORIZATION_HEADER_NAME.toLowerCase()]
        if (authHeaderValue) {
            if (authHeaderValue.indexOf('digestId=') > -1 &&
                authHeaderValue.indexOf('digestSignedHeaders=') > -1 &&
                authHeaderValue.indexOf('digestSignature=') > -1) {

                return authHeaderValue
            } else {
                logger.error('Authorization header value is invalid', authHeaderValue)
                return null
            }
        } else {
            logger.error('Authorization header not found')
            return null
        }
    }
}

module.exports = HTTPResponse