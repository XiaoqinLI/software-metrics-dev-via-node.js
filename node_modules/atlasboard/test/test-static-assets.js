var path = require('path'),
    web_routes = require ('../lib/webapp/routes.js'),
    request = require('request'),
    assert = require('assert'),
    fs = require('fs');

describe ('static assets', function(){
  var app;
  var port = 4444;
  before(function(){
    app = require('express')();
    var configPath = path.join(process.cwd(), 'test', 'fixtures', 'config','log-disabled.json');
    var config = require('../lib/config-manager')(configPath);
    config.wallboardAssetFolder = path.join(process.cwd(), 'test', 'fixtures', 'assets');
    web_routes(app, null, null, config);
    app.listen(port);
  });

  after(function(){
    //app.close(); //close method in express.js 3.x?
  });

  describe ('images', function(){
    it('should return atlasboard images', function(done){
      request('http://localhost:' + port + '/images/red-up.png', function(err, response, body){
        assert.ok(!err);
        assert.equal(200, response.statusCode);
        assert.ok(body);
        done();
      });
    });

    it('should not return non existant atlasboard images', function(done){
      request('http://localhost:' + port + '/images/red-upxxxxxx.png', function(err, response, body){
        assert.ok(!err);
        assert.equal(404, response.statusCode);
        done();
      });
    });

    it('should return wallboard images', function(done){
      request('http://localhost:' + port + '/images/green-down-wallboard-asset.png', function(err, response, body){
        assert.ok(!err);
        assert.equal(200, response.statusCode);
        assert.ok(body);
        done();
      });
    });

    it('should return wallboard images over atlasboard ones if the name is the same', function(done){
      request('http://localhost:' + port + '/images/red-up.png', function(err, response, body){
        assert.ok(!err);
        assert.equal(200, response.statusCode);
        // this file is not a valid image. It contains just one character to be able to assert
        // that we are fetching the one in the wallboard folder and not the one in atlasboard.
        assert.equal(1, body.length);
        done();
      });
    });
  });

  describe ('css and stylus', function(){
    it('should render and return stylus', function(done){
      request('http://localhost:' + port + '/stylesheets/application.css', function(err, response, body){
        assert.ok(!err);
        assert.equal(200, response.statusCode);
        assert.ok(body);
        done();
      });
    });

    it('should cache stylus output so the second request should be blazing fast', function(done){
      this.timeout(50);
      request('http://localhost:' + port + '/stylesheets/application.css', function(err, response, body){
        assert.ok(!err);
        assert.equal(200, response.statusCode);
        assert.ok(body);
        done();
      });
    });

    it('should render the output in compiled folder', function(done){
      var compiledCSSPath = path.join(process.cwd(), '/test/fixtures/assets/compiled/stylesheets/application.css');
      fs.exists(compiledCSSPath, function(exist){
        assert.ok(exist);
        fs.unlink(compiledCSSPath, function(err){
          assert.ifError(err);
          done();
        })
      });
    });

  });
});
