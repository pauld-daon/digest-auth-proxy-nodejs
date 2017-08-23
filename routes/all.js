var logger = require('../logger'),
	express = require('express'),
	router = express.Router(),
	RoutingDao = require('../model/routingDao')

router.use('*', function(req, res, next) {
	res.contentType('application/json')

	RoutingDao.process(req, function(err, idxRes, idxResBody) {
		if (err) {
			logger.error('Could not process request', err.message ? err.message : err.statusMessage)
			
			if (err.message) {
				return res.status(500).send({ 'error': err.message })
			} else if (err.statusCode) {
				return res.status(err.statusCode).send(err.statusMessage)
			}
		}

		try {
			if (idxResBody) {
				var resBodyParsed = JSON.parse(idxResBody)
				res.status(idxRes.statusCode).end(JSON.stringify(resBodyParsed))
			} else {
				res.status(idxRes.statusCode).send()
			}
		} catch (ex) {
			logger.error("Could not parse JSON", ex.message)
			res.status(500).send({ 'error': ex.message })
		}
	})
})

module.exports = router