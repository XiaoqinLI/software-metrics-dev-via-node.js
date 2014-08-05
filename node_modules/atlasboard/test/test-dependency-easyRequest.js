var assert = require ('assert'),
    path = require('path'),
    nock = require('nock');
 
describe ('dependency easyRequest', function(){

  var options, easyRequest;

  beforeEach(function(done){
    nock.cleanAll();
    options = { url : 'http://invalid/' };
    easyRequest = require('../lib/job-dependencies/easyRequest/dependency')();
    done();
  });

  describe ('JSON', function(){
    it('should handle non 200 status code', function(done){
      nock('http://invalid').get('/').reply(404, {});
    
      easyRequest.JSON(options, function(err, data){
        assert.ok(err);
        done();
      });
    });

    it('should handle empty responses', function(done){
      nock('http://invalid').get('/').reply(500, "");

      easyRequest.JSON(options, function(err, data){
        assert.ok(err);
        done();
      });
    });

    it('should handle non JSON responses', function(done){
      nock('http://invalid').get('/').reply(200, "this is not json, is it?");

      easyRequest.JSON(options, function(err, data){
        assert.ok(err);
        assert.equal('invalid json response', err);
        done();
      });
    });

    it('should handle successful responses', function(done){
      nock('http://invalid').get('/').reply(200, { attr : 'some data'});

      easyRequest.JSON(options, function(err, data){
        assert.ifError(err);
        assert.equal('some data', data.attr);
        done();
      });
    });
  });

  describe ('HTML', function(){
    it('should handle non 200 status code', function(done){
      nock('http://invalid').get('/').reply(404, "not found");
    
      easyRequest.HTML(options, function(err, data){
        assert.ok(err);
        done();
      });
    });

    it('should handle empty responses', function(done){
      nock('http://invalid').get('/').reply(500, "");

      easyRequest.HTML(options, function(err, data){
        assert.ok(err);
        done();
      });
    });

    it('should handle successful responses', function(done){
      nock('http://invalid').get('/').reply(200, "<h2>hello</h2>");

      easyRequest.HTML(options, function(err, data){
        assert.ifError(err);
        assert.equal('<h2>hello</h2>', data);
        done();
      });
    });
  });

});
