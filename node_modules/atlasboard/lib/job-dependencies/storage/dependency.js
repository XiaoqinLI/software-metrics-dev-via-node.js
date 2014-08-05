module.exports = function (jobWorker, io, globalConfig){
  var fsStorageClass = require('./implementations/fs-storage.js');
  return new fsStorageClass(jobWorker.id, {});
};