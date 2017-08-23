var crypto = require('crypto'),
	logger = require('../../logger'),
	config = require('../../config/config'),
    cryptoUtil = require('./cryptoUtil'),

    HTTPRequest = require('./classes/HTTPRequest'),
    HTTPResponse = require('./classes/HTTPResponse')

/**
 * Add the relevant HTTP headers to teh request for authentication
 * @param {*} req : HTTPRequest object
 * @param {*} next 
 */
var addAuthorizationHeaders = function(req, next) {
    req.setContentTypeHeader()
    req.setAuthDateHeader()
    req.setIdxOriginHeader()

    var digestAuthHeader = generateDigestAuthHeader(req)
    req.setAuthorizationHeader(digestAuthHeader)

    next(null, req)
}

/**
 * Generate the digest authorization header
 * @param {*} req : HTTPRequest object
 */
function generateDigestAuthHeader(req) {
    var canonicalRequestHashHex = req.canonicalRequestHashHex()
    var signedHeadersString = req.signedHeadersString()

    // e.g. w-5dYEsf6JLWgY4Mv3k9EQ/20170817/fa103df5-8d89-49ef-b1b6-b205a1736761/digest_request
    var id = config.identityx.sharedKeyId + '/' + req.datestamp + '/' + req.nonce + '/digest_request'

    /**
     * e.g.
        HMAC-SHA-256
        20170818T000853Z
        w-5dYEsf6JLWgY4Mv3k9EQ/20170818/7e494974-77f8-4d04-ad83-2fca746eb690/digest_request
        74fa47f2cc315dd57e54fd60e02e04f6eb5d40e93a076e46dff35451bbb26a42
     */
    var stringToSign = 'HMAC-SHA-256\n' +
                       req.timestamp + '\n' +
                       id + '\n' +
                       canonicalRequestHashHex
    
    logger.debug('stringToSign\n', stringToSign)

    var kDateRaw = req.datestamp + 'Digest'
    var kDateSigned = cryptoUtil.sign(kDateRaw, Buffer.from(cryptoUtil.decryptedSharedKey(), 'base64')).digest()
    logger.debug('Signing key hex 1', cryptoUtil.sign(kDateRaw, cryptoUtil.decryptedSharedKey()).digest('hex'))
        
    var kNonce = cryptoUtil.sign(req.nonce, kDateSigned).digest()
    logger.debug('Signing key hex 2', cryptoUtil.sign(req.nonce, kDateSigned).digest('hex'))

    var kSigning = cryptoUtil.sign('digest_request', kNonce).digest()
    logger.debug('Signing key hex 3', cryptoUtil.sign('digest_request', kNonce).digest('hex'))

    var signature = cryptoUtil.sign(stringToSign, kSigning).digest('hex')
    logger.debug('Final signature hex', signature)

    /**
     * e.g. Digest digestId=w-5dYEsf6JLWgY4Mv3k9EQ/20170818/7e494974-77f8-4d04-ad83-2fca746eb690/digest_request, digestSignedHeaders=auth-date;content-type;x-idxorigin, digestSignature=4af884b9e0f7a540063eaf237c0360dc4e6d82b969ae39e3c3c493fcbb4d35d6
     */
    var authorizationHeader = 'Digest ' +
                              'digestId=' + id +
                              ', digestSignedHeaders=' + signedHeadersString +
                              ', digestSignature=' + signature
    
    return authorizationHeader
}

/**
 * Verify the response digest
 * @param {*} response - http.ServerResponse object
 * @param {*} body - response body data
 * @param {*} next 
 */
verifyResponseDigest = function(response, body, next) {
    var res = new HTTPResponse(new Date(),
                               response.statusCode,
                               response.headers,
                               body)
    
    var canonicalResponseHashHex = res.canonicalResponseHashHex()
    var signedHeadersString = res.signedHeadersString()

    var id = config.identityx.sharedKeyId + '/' + res.datestamp + '/' + res.nonce + '/digest_request'

    var stringToSign = 'HMAC-SHA-256\n' +
                       res.timestamp + '\n' +
                       id + '\n' +
                       canonicalResponseHashHex
    
    logger.debug('stringToSign\n', stringToSign)
    
    var kDateRaw = res.datestamp + 'Digest'
    var kDateSigned = cryptoUtil.sign(kDateRaw, Buffer.from(cryptoUtil.decryptedSharedKey(), 'base64')).digest()
    var kNonce = cryptoUtil.sign(res.nonce, kDateSigned).digest()
    var kSigning = cryptoUtil.sign('digest_request', kNonce).digest()
    var signature = cryptoUtil.sign(stringToSign, kSigning).digest('hex')

    logger.debug('Response signature:  ', res.responseSignature())
    logger.debug('Generated signature: ', signature)

    if (signature === res.responseSignature())
        return next()
    else
        return next(new Error('Response signature does not match generated signature'))
}

module.exports = {
	addAuthorizationHeaders: addAuthorizationHeaders,
    verifyResponseDigest: verifyResponseDigest
}