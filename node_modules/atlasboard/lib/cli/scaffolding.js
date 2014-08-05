var ejs = require('ejs'),
    path = require('path'),
    fs = require('fs'),
    mkdirp = require('mkdirp');

module.exports = {

  /**
   * Folder scaffolding
   * @param  {string}   templateSourceFolder Templating source
   * @param  {string}   destinationFolder    Destination folder
   * @param  {object}   options (optional)
   *                    options.engine : templating engine ('ejs')
   *                    options.replace : object with replacement options
   * @param  {Function} cb                   Callback (err, null);
   */
  scaffold : function (templateSourceFolder, destinationFolder, options, cb){
    
    if (!cb) { // options parameter is optional
      cb = options;
      options = {};
    }

    function applyReplacements(fileName, replacements){
      for (item in replacements) {
        var replace = replacements[item];
        if (fileName.indexOf(item) > -1) {
          fileName = fileName.replace(item, replace);
          break;
        }
      }
      return fileName;
    }

    // based on http://stackoverflow.com/questions/13786160/copy-folder-recursively-in-node-js
    var copyRecursiveSync = function(src, dest) {
      var exists = fs.existsSync(src);
      var stats = exists && fs.statSync(src);
      var isDirectory = exists && stats.isDirectory();
      if (exists && isDirectory) {
        fs.mkdirSync(dest);
        fs.readdirSync(src).forEach(function(childItemName) {
          copyRecursiveSync(path.join(src, childItemName),
                            path.join(dest, childItemName));
        });
      } else {
        var destinationFile =  applyReplacements(dest, options.replace || {});
        if (options.engine === 'ejs') {
          fs.writeFileSync(destinationFile,
              ejs.render(fs.readFileSync(src).toString(), options.data));
        }
        else {
          fs.linkSync(src, destinationFile);
        }
      }
    };

    mkdirp(path.dirname(destinationFolder), function(err){
      if (err) return cb (err);

      copyRecursiveSync(templateSourceFolder, destinationFolder);
      cb(null);
    });
  }

};