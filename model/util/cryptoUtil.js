var crypto = require('crypto'),
    config = require('../../config/config'),
	logger = require('../../logger'),
    fs = require('fs'),
    NodeRSA = require('node-rsa'),

    ALGORITHM = 'sha256'

/**
 * Base64 Decrypted shared key from encrypted shared key in the credential.properties file
 * using the private key in the pem file
 */
function decryptedSharedKey() {
    var pkPem = fs.readFileSync(config.httpClient.privateKeyPath)
    var pk = new NodeRSA(pkPem, 'pkcs1-private-pem', { encryptionScheme: 'pkcs1', signingScheme: 'pkcs1-sha256' })
    var encryptedSharedKey = config.identityx.encryptedSharedKey
    var decryptedSharedKey = pk.decrypt(encryptedSharedKey, 'base64')
    return decryptedSharedKey
}

/**
 * Generate a hash using SHA256
 * Chain this function with ".digest('hex')" for hex string, or ".digest()" for byte array
 * @param {*} textBytes 
 */
function hash(textBytes) {
    return crypto.createHash(ALGORITHM).update(textBytes)
}

/**
 * Generate a HMAC using SHA256
 * Chain this function with ".digest('hex')" for hex string, or ".digest()" for byte array
 * @param {*} data
 * @param {*} key 
 */
function sign(data, key) {
    return crypto.createHmac(ALGORITHM, key).update(data)
}

function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
    .toString(16)
    .substring(1)
}

/**
 * Generate a GUID
 */
function guid() {
    // e.g. 41b35788-768f-f939-4ff3-7fd3c67b12a4
    return (s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4())
}

module.exports = {
    decryptedSharedKey: decryptedSharedKey,
	hash: hash,
    sign: sign,
    guid: guid
}