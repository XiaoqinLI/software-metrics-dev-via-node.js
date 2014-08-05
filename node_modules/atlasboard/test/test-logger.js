var assert = require ('assert');

describe ('logger', function(){

  describe('standalone', function(){
    var logger = require ('../lib/logger')();

    it('should contain a log method', function(done){
      assert.equal('function', typeof logger.log);
      done();
    });

    it('should contain a warn method', function(done){
      assert.equal('function', typeof logger.warn);
      done();
    });

    it('should contain an error method', function(done){
      assert.equal('function', typeof logger.error);
      done();
    });

  });

  describe('job logger', function(){
    var jobMock = {};
    var ioMock = {};

    var logger = require ('../lib/logger')(jobMock, ioMock);

    it('should contain a log method', function(done){
      assert.equal('function', typeof logger.log);
      done();
    });

    it('should contain a warn method', function(done){
      assert.equal('function', typeof logger.warn);
      done();
    });

    it('should contain an error method', function(done){
      assert.equal('function', typeof logger.error);
      done();
    });

    describe('io dependency', function(){
      it('should should emit to io sink', function(done){
        ioMock = {
          of: function (){
            return {
              emit: function(){
                done();
              }
            };
          }
        };

        logger = require ('../lib/logger')(jobMock, ioMock);
        logger.log('hola');
      });
    });
  });
});