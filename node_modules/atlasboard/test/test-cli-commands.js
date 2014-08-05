var assert = require ('assert');
var path = require ('path');
var rm = require ('rimraf');
var fs = require ('fs');
var proxyquire =  require('proxyquire');

var commands;

describe ('cli commands', function(){

  require('./includes/startup');

  var temp_folder = "test/tmp";
  var packagesLocalFolder = path.join(process.cwd(), "/test/fixtures/packages");

  //make sure temp folder is deleted even if tests fail (before and after)
  beforeEach(function(done){
    commands = proxyquire('../lib/cli/commands', {
      './commands-logic': {
          'generate' : function(projectDir, defaultPackage, itemType, itemName, callback){
            callback(null);
          }
      }
    });

    rm(temp_folder, function(){
      fs.mkdir(temp_folder, done);
    });
  });

  afterEach(function(done){
    rm(temp_folder, done);
  });

  describe ('generate', function(){

    it('should exit with errors if no args are passed', function(done){
      var args = [];
      commands.generate.run(args, function(err) {
        assert.ok(err);
        done();
      });
    });

    it('should exit with errors if only element type is passed', function(done){
      var args = ['job'];
      commands.generate.run(args, function(err) {
        assert.ok(err);
        done();
      });
    });

    it('should not exit with errors if correct arguments are passed', function(done){
      var args = ['job', 'test'];
      commands.generate.run(args, function(err) {
        assert.ok(!err, err);
        done();
      });
    });

    it('should pass the right parameters to the logic module', function(done){
      var args = ['job', 'test'];
      commands = proxyquire('../lib/cli/commands', {
        './commands-logic': {
            'generate' : function(projectDir, defaultPackage, itemType, itemName, callback){
              assert.equal(defaultPackage, 'default');
              assert.equal(itemType, 'job');
              assert.equal(itemName, 'test');
              callback(null);
            }
        }
      });

      commands.generate.run(args, function(err) {
        assert.ok(!err, err);
        done();
      });
    });

    it('should pass the right parameters to the logic module when item includes package', function(done){
      var args = ['job', 'mypackage#test'];
      commands = proxyquire('../lib/cli/commands', {
        './commands-logic': {
            'generate' : function(projectDir, defaultPackage, itemType, itemName, callback){
              assert.equal(defaultPackage, 'mypackage');
              assert.equal(itemType, 'job');
              assert.equal(itemName, 'test');
              callback(null);
            }
        }
      });

      commands.generate.run(args, function(err) {
        assert.ok(!err, err);
        done();
      });
    });

  });

  describe ('new', function(){

    it('should exit with errors if bad arguments are passed', function(done){
      var args = [];
      commands.new.run(args, function(err) {
        assert.ok(err);
        done();
      });
    });

    it('should pass the right parameters to the logic module when item includes package', function(done){
      var args = ['mywallboard'];
      commands = proxyquire('../lib/cli/commands', {
        './commands-logic': {
            'newProject' : function(srcDir, destDir, callback){
              assert.equal(destDir.length - destDir.lastIndexOf('mywallboard'), 11);
              callback('error so we can interrupt execution and assert just for valid parameters');
            }
        }
      });

      commands.new.run(args, function(err) {
        assert.ok(err, err);
        done();
      });
    });

  });

  describe ('start', function(){

    it('should pass job filter parameters forward', function(done){
      var args = ['3000', '--job', 'myJobFilter'];
      commands = proxyquire('../lib/cli/commands', {
        './commands-logic': {
            'start' : function(options, callback){
              assert.equal(options.filters.jobFilter, 'myJobFilter');
              callback();
            }
        }
      });

      commands.start.run(args, function(err) {
        assert.ok(!err, err);
        done();
      });
    });

    it('should pass dashboard filter parameters forward', function(done){
      var args = ['3000', '--dashboard', 'myDashboardFilter'];
      commands = proxyquire('../lib/cli/commands', {
        './commands-logic': {
            'start' : function(options, callback){
              assert.equal(options.filters.dashboardFilter, 'myDashboardFilter');
              callback();
            }
        }
      });

      commands.start.run(args, function(err) {
        assert.ok(!err, err);
        done();
      });
    });

  });

});