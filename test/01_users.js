var request = require('supertest'),
    should = require('should'),
    config = require('../config/config'),
    logger = require('../logger'),
    async = require("async"),
    url = require('url')

describe('Users', function() {
  var host = config.test.apiUrl
  var path = url.parse(config.identityx.serviceUrl).path + 'users/'
  var userId = 'NodeJS_Automated_Test'

  describe('CRUD', function() {

    it('create user', function(done) {
      var user = { "userId": userId }

      request(host)
      .post(path)
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json')
      .send(user)
      .expect('Content-Type', /json/)
      .expect(201)
      .end(function(err, res) {
        if (err) return done(err)
        done()
      })
    })

    it('get and archive user', function(done) {
      request(host)
      .get(path + '?status=ACTIVE&userId=' + userId)
      .set('Accept', 'application/json')
      .expect(200)
      .end(function(err, res) {
        if (err) return done(err)
        
        should.exist(res.body)
        res.body.should.have.propertyByPath("items")
        
        if (res.body && res.body['items'] && res.body['items'].length == 1) {
          res.body['items'][0].should.have.property("userId", userId)
          var id = res.body['items'][0]['id']

          return archiveUser(id, done)

        } else {
          logger.error('Invalid response body', res.body)
          done(new Error('Invalid response body'))
        }
      })
    })

    function archiveUser(id, done) {
      request(host)
      .post(path + id + '/archived')
      .expect(200)
      .end(function(err, res) {
        if (err) return done(err)
        done()
      })
    }
    
  })
})