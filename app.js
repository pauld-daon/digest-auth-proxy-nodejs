var express = require('express'),
    path = require('path'),
    logger = require('./logger'),
    bodyParser = require('body-parser'),
    app = express(),
    server = require('http').createServer(app),
    config = require('./config/config'),
    allRoutes = require('./routes/all')

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'jade')

// Allow self-signed certificates
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

app.use(bodyParser.text({type: '*/*'}))
app.use(express.static(path.join(__dirname, 'www')))

// Set all response headers
app.use('/', function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Methods', 'GET,PUT,PATCH,POST,DELETE,OPTIONS')
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    next()
})

// Log all requests for all controllers
app.use('*', function(req, res, next) {
    logger.info('--------', req.method, req.originalUrl)
    next()
})

// Routes
app.use('*', allRoutes)

server.listen(config.port, function() {
    logger.info('[%s] Listening on port %d...', config.env, config.port)
})

// Catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found')
    err.status = 404
    next(err)
})

// Error handlers

// Development error handler
// Will print stacktrace
if (config.env === 'DEV') {
    app.use(function(err, req, res, next) {
        res.contentType('text/html')
        logger.error(err.message)
        res.status(err.status || 500)
        res.render('error', {
            message: err.message,
            error: err
        })
    })
}

// Production error handler
// No stacktrace leaked to user
app.use(function(err, req, res, next) {
    res.contentType('text/html')
    logger.error(err.message, req.url)
    res.status(err.status || 500)
    res.render('error', {
        message: err.message,
        error: {}
    })
})

module.exports = app