var winston = require('winston')
var config = require('./config/config')

var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      level: 'debug',
      json: false,
      prettyPrint: true,
      colorize: true,
      handleExceptions: true
    }),
    new (winston.transports.File)({
      name: 'info-file',
      filename: config.log.infoLogFilePath,
      level: 'info',
      json: false,
      handleExceptions: false
    }),
    new (winston.transports.File)({
      name: 'error-file',
      filename: config.log.errorLogFilePath,
      level: 'error',
      json: false,
      handleExceptions: true
    })
  ]
})

module.exports = logger