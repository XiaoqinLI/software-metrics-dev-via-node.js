var assert = require ('assert'),
    helpers = require ('../lib/helpers'),
    path = require ('path');

describe ('helpers', function(){

  describe('isPathContainedInRoot', function(){
    it('should contain root', function(done){
      assert.ok(helpers.isPathContainedInRoot("/test/wibble", "/test"));
      assert.ok(!helpers.isPathContainedInRoot("/root/test/wibble", "/test"));
      done();
    });

    it('should accept relative paths to the process', function(done){
      assert.ok(helpers.isPathContainedInRoot("wibble", process.cwd()));
      assert.ok(!helpers.isPathContainedInRoot("/wibble", process.cwd()));
      done();
    });

    it('should handle non string types gracefully', function(done){
      assert.ok(!helpers.isPathContainedInRoot("/test/wibble", 333));
      done();
    });

  });

  describe('areValidPathElements', function(){
    it('should sanitize string input', function(done){
      assert.ok(helpers.areValidPathElements("wibble"));
      assert.ok(!helpers.areValidPathElements("../wibble"));
      done();
    });

    it('should sanitize arrays of string input', function(done){
      assert.ok(helpers.areValidPathElements(["wibble", "other valid"]));
      assert.ok(!helpers.areValidPathElements(["../wibble", "valid"]));
      assert.ok(!helpers.areValidPathElements(["../wibble", "../invalid"]));
      done();
    });

    it('should sanitize number input', function(done){
      assert.ok(helpers.areValidPathElements(4444));
      done();
    });

    //http://docs.nodejitsu.com/articles/file-system/security/introduction
    it('should return invalid path if poison null bytes found', function(done){
      assert.ok(!helpers.areValidPathElements("input\0file"));
      done();
    });

    it('should return invalid path if .. found', function(done){
      assert.ok(!helpers.areValidPathElements("input..file"));
      done();
    });

  });

  describe('getJSONFromFile', function(){
    it('should return default value if file not found', function(done){
      var defaultValue = {};
      var filePath = 'invalid_path.txt';
      assert.equal(defaultValue, helpers.getJSONFromFile(filePath, defaultValue));
      assert.equal("test", helpers.getJSONFromFile(filePath, "test"));
      done();
    });

    it('should call callback if file not found', function(done){
      var filePath = path.join(process.cwd(), 'test', 'fixtures', 'config', 'DOES-NOT-EXISTS-valid_config.json');
      var content = helpers.getJSONFromFile(filePath, {}, function(path){
        assert.equal(filePath, path);
        done();
      });
    });

    it('should return default value if file is not valid JSON', function(done){
      var defaultValue = {};
      var filePath = path.join(process.cwd(), 'test', 'fixtures', 'config', 'invalid_config.json');
      assert.equal(defaultValue, helpers.getJSONFromFile(filePath, defaultValue));
      assert.equal("test", helpers.getJSONFromFile(filePath, "test"));
      done();
    });

    it('should call callback if file is not valid JSON', function(done){
      var filePath = path.join(process.cwd(), 'test', 'fixtures', 'config', 'invalid_config.json');
      var content = helpers.getJSONFromFile(filePath, {}, null, function(path, err){
        assert.equal(filePath, path);
        done();
      });
    });

    it('should return default value if file is not valid JSON', function(done){
      var filePath = path.join(process.cwd(), 'test', 'fixtures', 'config', 'valid_config.json');
      var content = helpers.getJSONFromFile(filePath, {});
      assert.equal("val1", content.key1);
      done();
    });

  });

});