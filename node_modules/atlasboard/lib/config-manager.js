var fs = require('fs'),
    path = require('path'),
    extend = require('xtend'),
    helpers = require('./helpers'),
    logger = require('./logger')();

module.exports = function(wallboardConfigFilePath, atlasboardConfigFilePath) {
  if (!wallboardConfigFilePath){
    wallboardConfigFilePath = path.join(process.cwd(), "/config/atlasboard.json");
  }

  if (!atlasboardConfigFilePath){
    atlasboardConfigFilePath = path.join(__dirname, "../config/defaultAtlasboard.json");
  }

  function doesNotExistsCallback(path){
    logger.error('\n----------------------\nERROR! Config file does not exist: ' + path + '. Using defaults...\n----------------------');
  }

  function isInvalidCallback(path){
    throw 'ERROR! Invalid JSON config file: ' + path;
  }

  var config = extend(
    helpers.getJSONFromFile(atlasboardConfigFilePath, {}, null, isInvalidCallback),
    helpers.getJSONFromFile(wallboardConfigFilePath, {}, doesNotExistsCallback, isInvalidCallback)
  );

  return {
    get: function (key){
      if (config){
        return config[key];
      }
      return null;
    }
  };
};