var assert = require ('assert');
var path = require ('path');
var cli_generator = require ('../lib/cli/commands-logic');
var rm = require ("rimraf");
var fs = require ("fs");

function executeCmd (command, callback){
  var path = process.cwd();
  var childProcess = require('child_process');
  var child = childProcess.spawn('npm', ["install", pathPackageJson], {stdio: 'inherit'});
  console.log ('\nChecking npm dependencies for ' + pathPackageJson + '...');
  child.on('error', function (err) {
    callback('Error installing dependencies for ' + pathPackageJson + '. err:' + err);
  });
  child.on('exit', function (code) {
    callback(code !== 0 ? 'error installing ' + pathPackageJson : null);
  });
}


describe ('cli commands logic', function(){

  var temp_folder = "test/tmp";
  var packagesLocalFolder = path.join(process.cwd(), "/test/fixtures/packages");

  //make sure temp folder is deleted even if tests fail (before and after)
  before(function(done){
    rm(temp_folder, done);
  });

  after(function(done){
    rm(temp_folder, done);
  });

  describe ('new', function(){
    it('should ..', function(done){
        done();
    });
  });

});