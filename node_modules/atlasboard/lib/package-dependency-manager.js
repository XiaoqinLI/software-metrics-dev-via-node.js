var async = require('async'),
    fs = require('fs'),
    path = require('path'),
    _ = require ('underscore'),
    readJson = require('read-package-json'),
    semver = require('semver');

module.exports.installDependencies = function (packagesPath, callback){

  // Process all available package containers
  async.map (packagesPath.filter(fs.existsSync), checkPackagesFolder, function(err, results){
    if (err){ return callback(err); }
    var paths = _.flatten(results);

    async.eachSeries(paths, checkValidIfAtlasboardVersionForPackage, function (err){
      if (err){
        return callback(err);
      }

      async.eachSeries(paths, install, function (err){
        callback(err);
      });
    });
  });
};

var atlasboardPackageJsonPath = path.join(__dirname, '../'); // in both test and production env will be located here.

/**
 * Search for packages in the current folder
 */

function checkPackagesFolder (packagesPath, cb){
  fs.readdir(packagesPath, function(err, allPackagesDir){
    if (err){ return cb(err); }

    // convert to absolute path
    allPackagesDir = allPackagesDir.map(function(partial_dir){
        return path.join(packagesPath, partial_dir);});

    // make sure we have package.json file
    allPackagesDir = allPackagesDir.filter(function(dir){
      return fs.statSync(dir).isDirectory() && fs.existsSync(dir + '/package.json');
    });

    cb(null, allPackagesDir);
  });
}

/**
 * Install from package folder
 */
function getValidPackageJSON (pathPackage, callback) {
  readJson(pathPackage + '/package.json', callback);
}

/**
 * Install from package folder
 */
function checkValidIfAtlasboardVersionForPackage (pathPackage, callback){
  getValidPackageJSON(pathPackage, function(err, packageJson){
    if (err){
      return callback(err);
    }

    getValidPackageJSON(atlasboardPackageJsonPath, function(err, atlasboardPackageJson){
      if (err) { return callback('package.json not found for atlasboard at ' + atlasboardPackageJsonPath); }

      if (packageJson.engines && packageJson.engines.atlasboard){
        var ok = semver.satisfies(atlasboardPackageJson.version, packageJson.engines.atlasboard);
        var msg = 'Atlasboard version does not satisfy package dependencies at ' +
                  pathPackage + '. Please consider updating your version of atlasboard. Version required: '+
                  packageJson.engines.atlasboard + '. Atlasboard version: ' + atlasboardPackageJson.version;

        callback(ok ? null : msg);
      }
      else {
        callback(null); // not atlasboard reference in engines node
      }
    });
  });
}

/**
 * Install from package folder
 */
function install (pathPackageJson, callback){
  var currPath = process.cwd(); // save current path
  process.chdir(pathPackageJson);

  console.log ('\nChecking npm dependencies for ' + pathPackageJson + '...');
  executeCommand('npm', ["install", "--production", pathPackageJson], function(err, code){
    if (err){
      callback('Error installing dependencies for ' + pathPackageJson + '. err:' + err);
    } else {
      callback(code !== 0 ? 'error installing ' + pathPackageJson : null);
    }
  });

  process.chdir(currPath); //restore path
}

/**
 * Executes a command in a childProcess
 */

function executeCommand(cmd, args, callback) {
  var childProcess = require('child_process');
  var child = childProcess.spawn(cmd, args, {stdio: 'inherit'});
  child.on('error', function (err) {
    callback(err);
  });
  child.on('exit', function (code) {
    callback(null, code);
  });
}