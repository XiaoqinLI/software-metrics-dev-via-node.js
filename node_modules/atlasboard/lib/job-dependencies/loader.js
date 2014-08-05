//--------------------------------------------------------------
// Loads and return dependencies for a certain jobWorker object 
//
// - In order to create a new dependency, you need to create a folder within
//   the job-dependencies folder (i.e: cloudstorage), and create a dependency.js file
//   within that folder to expose the dependency.
//
// - Then, you can call this.cloudstorage within any job.
//--------------------------------------------------------------

var path = require ('path'),
    fs = require ('fs');

module.exports.fillDependencies = function (jobWorker, io, globalConfig){

  jobWorker.dependencies = {};

  var dependencyPath = path.join(__dirname);
  var dependencyFolders = fs.readdirSync(path.join(__dirname));

  for (var i = dependencyFolders.length - 1; i >= 0; i--) {
    var folderPath = path.join(dependencyPath, dependencyFolders[i]);
    var stat = fs.statSync(folderPath);
    if (stat.isDirectory()){
      try{
        jobWorker.dependencies[dependencyFolders[i]] = require(path.join(folderPath, 'dependency.js'))(jobWorker, io, globalConfig);
      }
      catch(e){
        console.error('error resolving dependency ' + dependencyFolders[i] + '. ERROR:' + e);
        throw 'error loading dependencies';
      }
    }
  };

};