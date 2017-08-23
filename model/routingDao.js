var request = require('request'),
	url = require('url'),
	logger = require('../logger'),
	config = require('../config/config'),
	digestAuth = require('./util/digestAuth'),
	HTTPRequest = require('./util/classes/HTTPRequest')

var process = function(rawReq, next) {
	var body = null
	if (Object.keys(rawReq.body).length !== 0) {
		body = rawReq.body
	}

	var httpRequest = new HTTPRequest(rawReq.method,
								  	  url.parse(rawReq.originalUrl).path,
                                      body)

	var requestOptions = {
		method: httpRequest.method,
		uri: httpRequest.href + httpRequest.queryString,
		body: httpRequest.body,
		timeout: 3000
	}

	if (config.httpClient.authType == 'BASIC') {
		var credentialsBase64 = new Buffer(config.httpClient.username+':'+config.httpClient.password).toString('base64')
		requestOptions.headers = {
			'Content-Type': 'application/json',
			'Authorization': 'Basic ' + credentialsBase64
		}

		sendRequest(request, requestOptions)
	}
	else if (config.httpClient.authType == 'DIGEST') {
		// Add the relevant HTTP headers to the request for authentication
		digestAuth.addAuthorizationHeaders(httpRequest, function(err, updatedRequest) {
			if (err) {
				logger.error('Error adding authentication headers', err.message)
				next(err)
			}

			requestOptions.headers = httpRequest.headers
			sendRequest(httpRequest, requestOptions)
		})
	} else {
		next(new Error('Unsupported authentication type: ' + config.httpClient.authType))
	}

	function sendRequest(httpRequest, requestOptions) {
		logger.debug('HTTP Request', requestOptions)

		request(requestOptions, function (err, res, body) {
			if (err) return next(err)
			logger.debug('HTTP Response Status:', res.statusCode)
			processResponse(res, body)
		})
	}

	function processResponse(res, body) {
		// Ensure the response status begins with a 2
		if (res.statusCode !== 0 && !('' + res.statusCode).match(/^2\d\d$/)) {
			return next(res)
		}

		logger.info('IdentityX request digest verified successfully')
		logger.debug('HTTP Response Headers', res.headers)

		if (config.httpClient.authType == 'DIGEST') {
			digestAuth.verifyResponseDigest(res, body, function(err) {
				if (err) return next(err)
				logger.info('Response digest verified successfully')
				next(null, res, body)
			})
		} else {
			next(null, res, body)
		}
	}
}

module.exports = {
	process: process
}