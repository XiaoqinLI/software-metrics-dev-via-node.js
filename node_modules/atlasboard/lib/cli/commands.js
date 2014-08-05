var path = require('path'),
    logicCli = require('./commands-logic'),
    logger = require('../logger')();

var DEFAULT_PACKAGE_FOLDER = 'default';

module.exports = {

  /**
   * generate
   * 
   * Generates an Atlasboard component
   * 
   * @params args[0] item type: job, dashboard or widget
   * @params args[1] item name
   */

  generate: {

    descr: "Generates a basic widget/dashboard/job with the given NAME when run in an AtlasBoard project base directory.",
    example: "atlasboard generate (widget/dashboard/job) NAME",

    run: function (args, cb) { // check for the right arguments
           
           if (args.length < 2) {
              cb && cb('Missing arguments');
              return;
           }

           var packageFolder = DEFAULT_PACKAGE_FOLDER;

           var itemType = args[0];
           var itemName = args[1];
           if (itemName.indexOf('#') > -1){ //package namespacing
             packageFolder = itemName.split('#')[0];
             itemName = itemName.split('#')[1];
           }
           return logicCli.generate(process.cwd(), packageFolder, itemType, itemName, function(err){
             cb && cb(err);
           });
         }
  },

  /**
   * new
   * 
   * Creates a new dashboard
   * 
   * @params args[0] dashboard directory
   */

  new: {

    descr: "Creates a new fully functional dashboard with the name given in NAME whose base lies in the current directory.",
    example: "atlasboard new NAME",

    run: function (args, cb) {

           if (args.length < 1) {
              cb && cb('Missing arguments');
              return;
           }
           var newDirectory = args[0];
           var srcDir = path.join(__dirname, "../..", "samples", "project");
           var destDir = path.join(process.cwd(), newDirectory);
           return logicCli.newProject (srcDir, destDir, function(err){
             if (err){
               cb && cb(err);
               return;
             }
             
             process.chdir(newDirectory);
             var childProcess = require('child_process');
             var child = childProcess.spawn('npm', ["install", "--production"], {stdio: 'inherit'});
             console.log ('Installing npm dependencies...');
             child.on('error', function () {
               console.log('\nError installing dependencies. Please run "npm install" inside the dashboard directory');
               cb && cb('Error installing dependencies');
             });
             child.on('exit', function () {
               console.log('\nSUCCESS !!');
               console.log('\nNew project "%s" successfully created. Now:\n', newDirectory);
               console.log(' 1. cd ' + newDirectory);
               console.log(' (optional: you can import the Atlassian package by running "git init;git submodule add https://bitbucket.org/atlassian/atlasboard-atlassian-package packages/atlassian"');
               console.log(' 2. start your server with `atlasboard start`');
               console.log(' 3. visit it at http://localhost:3000\n');
               cb && cb();
             });
          });
        }
  },

  /**
   * list
   * 
   * List of all Atlasboard components (widgets or jobs) within all available packages
   */

  list: {

    descr: "List all available components (widgets or jobs) within all available packages",
    example: "atlasboard list",

    run: function (args, cb) {

           function parse(package){
             console.log('\t\tPackage "' + path.basename(package.dir) + '":');
             package.items.forEach(function(item){
               console.log('\t\t    - ' + path.basename(item, '.js'));
             });
           }

           var packagesLocalFolder = path.join(process.cwd(), "/packages");
           var packagesAtlasboardFolder = path.join(__dirname, "../../packages");
           return logicCli.list([packagesLocalFolder, packagesAtlasboardFolder], function(err, packages){
             if (err){
               cb && cb('Error reading package folder');
               return;
             }

             console.log('Available widgets and jobs within all package folders:');
             packages.forEach(function(package){
               console.log(' ' + package.package);
               console.log('\t- Widgets:');
               package.widgets.forEach(parse);

               console.log('\t- Jobs:');
               package.jobs.forEach(parse);
             });
             cb && cb();
           });
         }
  },

  /**
   * start
   * 
   * When run in a project's base directory, starts the AtlasBoard server. 
   * 
   * @params args[0] port (optional)
   * @params args --jobFilter filter by job (optional)
   * @params args --dashboardFilter filter by dashboard (optional)
   */

  start: {

    descr: "When run in a project's base directory, starts the AtlasBoard server. " +
           "\n   Use $ atlasboard start <port> (to specify a port)." +
           "\n   Use --jobFilter or --dashboardFilter to only execute specific jobs or dashboards matching that regex",
    example: "atlasboard start 3333   #runs atlasboard in port 3333" +
             "\n        atlasboard start 3333 --job myjob   #runs only executing jobs matching 'myjob'" +
             "\n        atlasboard start 3333 --dashboard \\bdash   #only loads dashboards matching \\bdash regex",

    run: function (args, cb) {
           var port = isNaN(args[0]) ? 3000 : args[0];
           var options = {port: port, filters: {}};

           var argsOptimistic = require('optimist')(args).argv;
           
           if (argsOptimistic.job) {
             logger.log('Loading jobs matching ' + argsOptimistic.job + " only");
             options.filters.jobFilter = argsOptimistic.job;
           }

           if (argsOptimistic.dashboard) {
             logger.log('Loading dashboards matching ' + argsOptimistic.dashboard + " only");
             options.filters.dashboardFilter = argsOptimistic.dashboard;
           }

           logicCli.start(options, function(err){
             cb && cb(err);
           });
         }
  }
};
