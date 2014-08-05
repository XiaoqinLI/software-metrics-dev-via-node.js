var assert = require ('assert'),
    path = require('path'),
    proxyquire =  require('proxyquire');

function mockChildProcess(){
  return {
    on: function(ev, cb){
      if (ev === 'exit'){
        cb(0);
      }
    }
  };
}

var packagesLocalFolder = path.join(process.cwd(), "/test/fixtures/package_dependency_test");
var packagesInvalidPackageJSON = path.join(process.cwd(), "/test/fixtures/package_invalid_package_json");
var packagesSatisfyingAtlasboardVersion = path.join(process.cwd(), "/test/fixtures/package_dependency_atlasboard_version_satisfied");
var packagesUnSatisfyingAtlasboardVersion = path.join(process.cwd(), "/test/fixtures/package_dependency_atlasboard_version_unsatisfied");

var packageDependencyManagerMocked = proxyquire('../lib/package-dependency-manager', {
  'child_process': {
    spawn: function(cmd, args){
      assert.equal('npm', cmd);
      return mockChildProcess();
    }
  }
});

describe ('package dependency manager', function(){

  it('should install dependencies in all packages', function(done){
    packageDependencyManagerMocked.installDependencies([packagesLocalFolder], function(err){
      assert.ifError(err);
      done();
    });
  });

  it('should return error if invalid package.json', function(done){
    packageDependencyManagerMocked.installDependencies([packagesInvalidPackageJSON], function(err){
      assert.ok(err);
      assert.equal('EJSONPARSE', err.code);
      done();
    });
  });

  it('should not return error if atlasboard version dependency is satisfied', function(done){
    packageDependencyManagerMocked.installDependencies([packagesSatisfyingAtlasboardVersion], function(err){
      assert.ifError(err);
      done();
    });
  });

  it('should return error if atlasboard version dependency is unsatisfied', function(done){
    packageDependencyManagerMocked.installDependencies([packagesUnSatisfyingAtlasboardVersion], function(err){
      assert.ok(err.indexOf('does not satisfy') > -1);
      done();
    });
  });

});

