var assert = require ('assert'),
    path = require('path');

describe ('config manager', function(){

  it('should handle non existant config file', function(done){
    var configFilePath = path.join(process.cwd(), 'config', 'non_existant_config.json');
    var config = require ('../lib/config-manager')(configFilePath);
    assert.equal(null, config.get('test'));
    done();
  });

  it('should throw if invalid config file', function(done){
    var configFilePath = path.join(process.cwd(), 'test', 'fixtures', 'config', 'invalid_config.json');
    try {
      var config = require ('../lib/config-manager')(configFilePath);
    }
    catch(e){
      done();
    }
  });

  it('should handle valid config file', function(done){
    var configFilePath = path.join(process.cwd(), 'test', 'fixtures', 'config', 'valid_config.json');
    var config = require ('../lib/config-manager')(configFilePath);
    assert.equal('val1', config.get('key1'));
    done();
  });

  describe ('wallboard specific config', function(){

    it('should extend from atlasboard config', function(done){
      var atlasboardConfigFilePath = path.join(process.cwd(), 'test','fixtures', 'config', 'valid_config.json');
      var wallboardConfigFilePath = path.join(process.cwd(), 'test','fixtures', 'config', 'log-enabled.json');
      var config = require ('../lib/config-manager')(wallboardConfigFilePath, atlasboardConfigFilePath);
      assert.equal('val1', config.get('key1'));
      assert.equal(true, config.get('live-logging').enabled);
      done();
    });

    it('should shadow atlasboard default config', function(done){
      var atlasboardConfigFilePath = path.join(process.cwd(), 'test', 'fixtures', 'config', 'valid_config.json');
      var wallboardConfigFilePath = path.join(process.cwd(), 'test', 'fixtures', 'config', 'valid_config_shadowing.json');
      var config = require ('../lib/config-manager')(wallboardConfigFilePath, atlasboardConfigFilePath);
      assert.equal('val2', config.get('key1'));
      done();
    });

  });

});