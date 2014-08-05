//-------------------------------
// Filesystem storage implementation
// TODO
//-------------------------------

var util = require ('util'),
    fs = require('fs'),
    path = require('path');

function StorageRedis(options){
  this.options = options || {};
}

util.inherits(StorageRedis, require ('../storage-base'));

StorageRedis.prototype.get = function (key, callback){
  throw 'not implemented';
};

StorageRedis.prototype.set = function(key, value, callback){
  throw 'not implemented';
};

module.exports = StorageRedis;