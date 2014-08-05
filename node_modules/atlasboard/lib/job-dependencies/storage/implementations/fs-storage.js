//-------------------------------
// Filesystem storage implementation
//-------------------------------

var util = require ('util'),
    fs = require('fs'),
    path = require('path');

function StorageFS(storageKey, options){
  this.storageKey = storageKey;
  this.options = options || {};
  this.storagePath = options.storagePath || path.join(process.cwd(), "/job-data-storage.json");
}

util.inherits(StorageFS, require ('../storage-base'));

StorageFS.prototype.get = function (key, callback){
  var self = this;
  fs.readFile(self.storagePath, function (err, data){
    if (err) return callback(err);
    var data;
    try {
      var content = JSON.parse(data);
      data = content[self.storageKey] ? content[self.storageKey][key].data : null;
    }
    catch(e){
      return callback ('Error reading JSON from file');
    }
    callback(null, data);
  });
};

StorageFS.prototype.set = function(key, value, callback){
  var self = this;
  fs.readFile(self.storagePath, function (err, data){
    if (err) { data = "{}"; } //new file
    var content = {};
    try {
      content = JSON.parse(data);
    }
    catch (e){
      console.log('error reading file ' + self.storagePath);
    }
    content[self.storageKey] = content[self.storageKey] || {};
    content[self.storageKey][key] = { data : value };
    fs.writeFile(self.storagePath, JSON.stringify(content), function(err, data){
      callback && callback(err, content);
    });
  });
};

module.exports = StorageFS;