var PropertiesReader = require('properties-reader')

var config = {
    test: {},
    log: {},
    httpClient: {}
}

// HTTP Server Config
config.env = process.env.NODE_ENV || 'DEV', // DEV/PROD
config.port = process.env.DE_NOTIFICATION_SERVER_PORT || 3000
config.log.infoLogFilePath = process.env.DE_NOTIFICATION_SERVER_LOG_INFO || 'logs/info.log'
config.log.errorLogFilePath = process.env.DE_NOTIFICATION_SERVER_LOG_ERROR || 'logs/error.log'
config.test.apiUrl = process.env.DE_NOTIFICATION_SERVER_TEST_API_URL || "http://localhost:3000"

// Load credential.properties
var properties = PropertiesReader('./config/credential.properties')
config.identityx = properties.getAllProperties()

// Set authentication type - BASIC or DIGEST
config.httpClient.authType = 'DIGEST'

// Digest Authentication -location of the RSA private key PEM file
config.httpClient.privateKeyPath = './config/IdentityX.private.pem'

// HTTP Basic Authentication credentials
config.httpClient.username = 'realme'
config.httpClient.password = '6c4tw68r'

module.exports = config