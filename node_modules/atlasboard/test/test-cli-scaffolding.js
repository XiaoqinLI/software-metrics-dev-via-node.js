var assert = require ('assert');
var path = require ('path');
var scaffolding = require ('../lib/cli/scaffolding');
var rm = require ('rimraf');
var fs = require ('fs');

describe ('cli scaffolding', function(){

  require('./includes/startup');

  var temp_folder = "test/tmp";
  var simpleFolder = path.join(process.cwd(), "/test/fixtures/scaffolding/simplefolder");

  //make sure temp folder is deleted even if tests fail (before and after)
  function cleanup (cb){
    rm(temp_folder, function(){
      fs.mkdir(temp_folder, cb);
    });
  }

  //make sure temp folder is deleted even if tests fail (before and after)
  beforeEach(function(done){
    cleanup(done);
  });

  afterEach(function(done){
    cleanup(done);
  });

  describe ('scaffolding folder', function(){

    it('copy all items within the template folder to the destination folder', function(done){
      var destinationFolder = path.join(temp_folder,'simplefolder');
      scaffolding.scaffold(simpleFolder, destinationFolder, function(err){
        assert.ok(!err, err);
        fs.readdir(destinationFolder, function(err, files) {
          assert.equal(files.length, 2, 'all files were copied');
          done();
        });
      });
    });

    it('applies ejs template transformations', function(done){
      var destinationFolder = path.join(temp_folder,'simplefolder');
      var options = {
        engine: 'ejs',
        data: {
          name : 'testName'
        }
      };

      scaffolding.scaffold(simpleFolder, destinationFolder, options, function(err){
        assert.ifError(err);
        var file = path.join(destinationFolder, 'file1.js');
        fs.readFile(file, 'UTF-8', function read(err, data) {
            assert.ifError(err);
            assert.equal(data.indexOf('<h1>testName</h1>'), 0, 'expected content not found. current content: ' + data);
            done();
        });
      });
    });

    it('creates subfolders automatically', function(done){
      var destinationFolder = path.join(temp_folder, 'level1', 'level2', 'level3');
      scaffolding.scaffold(simpleFolder, destinationFolder, function(err){
        assert.ifError(err);
        fs.readdir(destinationFolder, function(err, files) {
          assert.equal(files.length, 2, 'all files were copied');
          done();
        });
      });
    });

    it('can rename destination files', function(done){
      var destinationFolder = path.join(temp_folder, 'level1', 'level2', 'level3');
      var options = {
        replace: {
          'file1' : 'archivo1'
        }
      };
      scaffolding.scaffold(simpleFolder, destinationFolder, options, function(err){
        assert.ifError(err);
        fs.readdir(destinationFolder, function(err, files) {
          assert.equal(files.length, 2, 'all files were copied');
          assert.equal(files[0], 'archivo1.js');
          assert.equal(files[1], 'file2.js');
          done();
        });
      });
    });

  });
});

