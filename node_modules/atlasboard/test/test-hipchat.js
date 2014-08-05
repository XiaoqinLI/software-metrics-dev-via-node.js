var assert = require ('assert');

var options = {
  api_key : '',
  request : {
    post : function (options, callback) {
      callback(null, null);
    }
  }
};

describe('Hipchat', function(){

  describe('auth', function(){

    it ('should throw error if no token provided', function (done){
      assert.throws(function(){
        var hipchat = require ('../lib/hipchat').create(options);
      });
      done();
    });

    it ('should not throw error if token provided', function (done){
      options.api_key = 'bP9qjpnsfVPLadW2gKR3vF4t62LI4z3Dfkc0e7LmNCebxBUjKH'; //this is an example. not a valid key
      var hipchat = require ('../lib/hipchat').create(options);
      done();
    });

  });

  describe('message', function(){

    var roomId = 33333;
    var from = 'night crawler';
    var message = 'this is just text';
    var notify = 1;

    it ('should push message with successful callback', function (done){
      options.request.post = function (options, callback) { //mock request post
        callback(null, {statusCode:200}, '');
      };

      var hipchat = require ('../lib/hipchat').create(options);
      hipchat.message (roomId, from, message, notify, function (err, response_status){
        assert.ok (!err);
        assert.equal (response_status, 200);
        done();
      });
    });

    it ('should handle known bad request errors', function (done){
      options.request.post = function (options, callback) { //mock request post
        callback('error', {statusCode:400}, '');
      };

      var hipchat = require ('../lib/hipchat').create(options);
      hipchat.message (roomId, from, message, notify, function (err, response_status){
        assert.ok (err);
        assert.equal (response_status, 400);
        done();
      });
    });

    it ('should handle unknown bad request errors', function (done){
      options.request.post = function (options, callback) { //mock request post
        callback('error', {statusCode: 510}, '');
      };

      var hipchat = require ('../lib/hipchat').create(options);
      hipchat.message (roomId, from, message, notify, function (err, response_status){
        assert.ok (err);
        assert.equal (response_status, 510);
        done();
      });
    });

    it ('should handle bad request errors with no statusCode', function (done){
      options.request.post = function (options, callback) { //mock request post
        callback('error', {}, '');
      };

      var hipchat = require ('../lib/hipchat').create(options);
      hipchat.message (roomId, from, message, notify, function (err, response_status){
        assert.ok (err);
        assert.equal (response_status, null);
        done();
      });
    });

    it ('should handle bad request errors with null response', function (done){
      options.request.post = function (options, callback) { //mock request post
        callback('error', null, '');
      };

      var hipchat = require ('../lib/hipchat').create(options);
      hipchat.message (roomId, from, message, notify, function (err, response_status){
        assert.ok (err);
        assert.equal (response_status, null);
        done();
      });
    });

  });
});