var assert = require ('assert');
var path = require ('path');
var commandLogic = require ('../lib/cli/commands-logic');
var rm = require ('rimraf');
var fs = require ('fs');
var async = require('async');

function assertFileContains(path, text, cb){
  fs.readFile(path, 'UTF-8', function read(err, data) {
    assert.ifError(err);
    assert.ok(data.indexOf(text)> -1, 'expected file to contain ' + text + '. Actual content: ' + data);
    cb();
  });
}

describe ('cli commands logic', function(){

  require('./includes/startup');

  var temp_folder = "test/tmp";
  var packagesLocalFolder = path.join(process.cwd(), "/test/fixtures/packages");

  function cleanup (cb){
    rm(temp_folder, function(){
      fs.mkdir(temp_folder, cb);
    });
  }

  //make sure temp folder is deleted even if tests fail (before and after)
  beforeEach(function(done){
    cleanup(done);
  });

  afterEach(function(done){
    cleanup(done);
  });

  describe ('new', function(){

    it('should create a new project ok', function(done){
      var projectPath = path.join(temp_folder, 'test');
      commandLogic.newProject("samples/project", projectPath, function(err){
        assert.ok(!err, err);
        assert.ok(fs.existsSync(path.join(projectPath, "package.json")));
        assert.ok(fs.existsSync(path.join(projectPath, "globalAuth.json")));
        assert.ok(fs.existsSync(path.join(projectPath, "assets")));
        assert.ok(fs.existsSync(path.join(projectPath, "packages")));
        assert.ok(fs.existsSync(path.join(projectPath, "packages", "demo", "dashboards")));
        assertFileContains(path.join(projectPath, "README.md"), "# test, my awesome", done); // templating works
      });
    });

    it('should return error if file name is not considered safe or valid', function(done){

      function test (name, cb){
        rm(temp_folder, function(err){
          fs.mkdir(temp_folder, function(err){
            commandLogic.newProject('samples/project', path.join(temp_folder, '' + name), function(err){
              cb(null, !err);
            });
          });
        });
      }

      var invalidNames = ['sample=', 'sample(', 'sample&','s#ample', 'samp@le', 'sample!wer'];
      var validNames = [33, '33', 'sample33', 'samp-le', 'samp_le'];

      function isInvalid(valid){return !valid;}
      function isValid(valid){return valid;}

      async.mapSeries(invalidNames, test, function(err, results){
        assert.ok(results.every(isInvalid));
        async.mapSeries(validNames, test, function(err, results){
          assert.ok(results.every(isValid));
          done();
        });
      });
    });

    it('should return error if invalid path', function(done){
      commandLogic.newProject("samples/project", '/etc/', function(err){
        assert.ok(err);
        done();
      });
    });

    it('should not create a new project from a folder where a atlasboard project already exists', function(done){
      commandLogic.newProject("samples/project", temp_folder, function(err){
        assert.ok(err);
        done();
      });
    });

    it('should have a valid config file', function(done){ //avoid shiping an invalid config file
      var projectPath = path.join(temp_folder, 'test');
      commandLogic.newProject("samples/project", projectPath, function(err){
        var config_path_contents = fs.readFileSync(path.join(projectPath, "config", "dashboard_common.json"));
        var JSONconfig = JSON.parse(config_path_contents);
        assert.ok(JSONconfig.config);
        done();
      });
    });

  });


  describe ('generate', function(){
    var projectPath = path.join(temp_folder, 'test');

    beforeEach(function(done){
      fs.mkdir(temp_folder, function(){
        commandLogic.newProject("samples/project", projectPath, done);
      });
    });

    it('should return error if bad resource type provided', function(done){
      commandLogic.generate("/ba/ddir", "default", "widgettt", "mywidget", function(err){
        assert.ok(err.indexOf("Invalid generator")>-1, err);
        done();
      });
    });

    it('should return error if no project exists in the provided path', function(done){
      commandLogic.generate("/b/addir", "default", "widget", "mywidget", function(err){
        assert.ok(err.indexOf("no project exists")>-1, err);
        done();
      });
    });

    it('should return error if unsafe item name is provided', function(done){
      commandLogic.generate(projectPath, "default", "widget", "../mywidget", function(err){
        assert.ok(err.indexOf("invalid")>-1, err);
        done();
      });
    });

    it('should return error if no item name is provided', function(done){
      commandLogic.generate(projectPath, "default", "widget", "", function(err){
        assert.ok(err.indexOf("invalid")>-1, err);
        done();
      });
    });

    describe ('widget', function(){
      it('should create widget successfully', function(done){
        commandLogic.generate(projectPath, "default", "widget", "newcalendar", function(err, data){
          assert.ok(!err, err);
          var htmlFileWidget = path.join(projectPath, "packages", "default", "widgets", "newcalendar", 'newcalendar.html');
          assertFileContains(htmlFileWidget, '<h2>newcalendar</h2>', done);
        });
      });

      it('should return error if widget already exists', function(done){
        commandLogic.generate(projectPath, "default", "widget", "newcalendar", function(err, data){
          commandLogic.generate(projectPath, "default", "widget", "newcalendar", function(err){
            assert.ok(err, err);
            done();
          });
        });
      });
    });


    describe ('job', function(){
      it('should create job successfully', function(done){
        commandLogic.generate(projectPath, "default", "job", "newcalendar", function(err, data){
          assert.ok(!err);
          var jobPath = path.join(projectPath, "packages", "default", "jobs", "newcalendar", "newcalendar.js");
          assertFileContains(jobPath, '* Job: newcalendar', done);
        });
      });

      it('should return error if job already exists', function(done){
        commandLogic.generate(projectPath, "default", "job", "newcalendar", function(err, data){
          commandLogic.generate(projectPath, "default", "job", "newcalendar", function(err){
            assert.ok(err, err);
            done();
          });
        });
      });

      it('should create a unit test template', function(done){
        commandLogic.generate(projectPath, "default", "job", "newcalendar", function(err, data){
          assert.ok(!err);
          var jobTestPath = path.join(projectPath, "packages", "default", "jobs", "newcalendar", "test", "test-newcalendar.js");
          assertFileContains(jobTestPath, '* Test file for Job: newcalendar', done);
        });
      });

    });

    describe ('dashboard', function(){
      it('should create dashboard successfully', function(done){
        commandLogic.generate(projectPath, "default", "dashboard", "newdashboard", function(err, data){
          assert.ok(!err, 'error generating dashboard: ' + err);
          var dashboard_folder = path.join(projectPath, "packages", "default", "dashboards");
          var dashboard_file = path.join(dashboard_folder, "newdashboard.json");
          assertFileContains(dashboard_file, '"layout": {', done);
        });
      });

      it('should return error if dashboard already exists', function(done){
        commandLogic.generate(temp_folder, "default", "dashboard", "newdashboard", function(err){
          assert.ok(err, err);
          done();
        });
      });
    });

  });

  describe ('list', function(){
    it('should list available components', function(done){
      commandLogic.list(packagesLocalFolder, function(err, lists){

        assert.ok(Array.isArray(lists));
        assert.equal(lists.length, 1);
        assert.equal(lists[0].package, packagesLocalFolder);

        assert.equal(lists[0].widgets.length, 2);

        assert.ok(lists[0].widgets[0].dir.indexOf('/test/fixtures/packages/default')>-1);
        assert.equal(lists[0].widgets[0].items.length, 0);

        assert.ok(lists[0].widgets[1].dir.indexOf('/test/fixtures/packages/otherpackage1')>-1);
        assert.equal(lists[0].widgets[1].items.length, 1);
        assert.ok(lists[0].widgets[1].items[0].indexOf('test/fixtures/packages/otherpackage1/widgets/blockers/blockers.js')>-1);

        assert.equal(lists[0].jobs.length, 2);

        assert.ok(lists[0].jobs[0].dir.indexOf('/test/fixtures/packages/default')>-1);
        assert.equal(lists[0].jobs[0].items.length, 3);
        assert.ok(lists[0].jobs[0].items[0].indexOf('/test/fixtures/packages/default/jobs/job1/job1.js')>-1);

        assert.ok(lists[0].jobs[1].dir.indexOf('/test/fixtures/packages/otherpackage1')>-1);
        assert.equal(lists[0].jobs[1].items.length, 3);
        assert.ok(lists[0].jobs[1].items[0].indexOf('/test/fixtures/packages/otherpackage1/jobs/job1/job1.js')>-1);

        done();
      });
    });

    it('should handle invalid package folders', function(done){
      var emptyPackagesFolder = 'test/config';
      commandLogic.list(emptyPackagesFolder, function(err, lists){
        assert.ifError(err);
        assert.equal(lists.length, 0);
        done();
      });
    });

    it('should not repeat results', function(done){
      commandLogic.list([packagesLocalFolder, packagesLocalFolder, packagesLocalFolder], function(err, lists){
        assert.ifError(err);
        assert.equal(lists.length, 1);
        done();
      });
    });

  });
});