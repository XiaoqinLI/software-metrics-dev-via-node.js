var assert = require ('assert');
var path = require ('path');
var jobs_manager = require('../lib/job-manager');

describe ('job_manager', function(){

  var packagesLocalFolder = path.join(process.cwd(), "/test/fixtures/packages");
  var packagesWithInvalidJob = path.join(process.cwd(), "/test/fixtures/package_invalid_job");
  var packagesWithInvalidDashboard = path.join(process.cwd(), "/test/fixtures/package_invalid_format");
  var packagesWithNoWidgetField = path.join(process.cwd(), "/test/fixtures/package_dashboard_with_no_widgets");
  var packagesWithNoLayoutField = path.join(process.cwd(), "/test/fixtures/package_dashboard_with_no_layout");
  var packagesNoSharedStateForJobs = path.join(process.cwd(), "/test/fixtures/package_job_sharing_state");

  //we use only wallboard local folder, since we don´t want our tests to depend on atlasboard jobs
  //var packagesAtlasboardFolder = path.join(process.cwd(), "/packages");

  var configPath = path.join(process.cwd(), "/test/fixtures/config");
  var invalidConfigPath = path.join(process.cwd(), "/test/fixtures/invalid-config");
  var validJsonWithInvalidFormatConfigPath = path.join(process.cwd(), "/test/fixtures/valid-json-invalid-structure-config");
  var noExistentConfigPath = path.join(process.cwd(), "/test/fixtures/THIS-PATH-DOES-NOT-EXISTS");

  it('should load dashboard', function(done){

    var options = {
      packagesPath: [packagesLocalFolder],
      configPath: configPath
    };

    jobs_manager.get_jobs(options, function(err, job_workers){
      assert.ok(!err, err);
      assert.equal(8, job_workers.length);

      assert.equal(job_workers[0].dashboard_name, "test_dashboard1");
      assert.equal(job_workers[1].dashboard_name, "test_dashboard1");

      assert.equal(job_workers[2].dashboard_name, "test_dashboard2");
      assert.equal(job_workers[3].dashboard_name, "test_dashboard2");
      assert.equal(job_workers[4].dashboard_name, "test_dashboard2");

      assert.equal(job_workers[5].dashboard_name, "other_test_dashboard1");
      done();
    });
  });

  it('should not load filtered dashboards', function(done){

    var options = {
      packagesPath: [packagesLocalFolder],
      configPath: configPath,
      filters: {
        dashboardFilter: "other_"
      }
    };

    jobs_manager.get_jobs(options, function(err, job_workers){
      assert.ok(!err, err);
      assert.equal(3, job_workers.length); // 4 job items, 3 valid jobs

      assert.equal(job_workers[0].dashboard_name, "other_test_dashboard1");
      assert.equal(job_workers[1].dashboard_name, "other_test_dashboards2");
      assert.equal(job_workers[2].dashboard_name, "other_test_dashboards2");
      done();
    });
  });

  it('should not load filtered jobs', function(done){

    var options = {
      packagesPath: [packagesLocalFolder],
      configPath: configPath,
      filters: {
        jobFilter: "job1"
      }
    };

    jobs_manager.get_jobs(options, function(err, job_workers){
      assert.ok(!err, err);
      assert.equal(3, job_workers.length);

      assert.equal(job_workers[0].dashboard_name, "test_dashboard1");
      assert.equal(job_workers[1].dashboard_name, "test_dashboard2");
      assert.equal(job_workers[2].dashboard_name, "other_test_dashboards2");
      done();
    });
  });

  it('should be able to get disable widgets', function(done){
    var options = {
      packagesPath: [packagesLocalFolder],
      configPath: configPath
    };

    jobs_manager.get_jobs(options, function(err, job_workers){
      assert.ok(!err);
      var disabled_jobs = job_workers.filter(function(job){ return job.widget_item.enabled;});
      assert.equal(6, disabled_jobs.length);
      done();
    });
  });

  it('should not return error if invalid dashboard is found since it has been filtered by item manager before', function(done){
    var options = {
      packagesPath: [packagesWithInvalidDashboard],
      configPath: configPath
    };

    jobs_manager.get_jobs(options, function(err, job_workers){
      assert.ok(!err);
      assert.equal(0, job_workers.length);
      done();
    });
  });

  it('should return error if layout field is not found in dashboard file', function(done){
    var options = {
      packagesPath: [packagesWithNoLayoutField],
      configPath: configPath
    };

    jobs_manager.get_jobs(options, function(err, job_workers){
      assert.ok(err.indexOf('No layout field found')>-1);
      done();
    });
  });

  it('should return error if widgets field is not found in dashboard file', function(done){
    var options = {
      packagesPath: [packagesWithNoWidgetField],
      configPath: configPath
    };

    jobs_manager.get_jobs(options, function(err, job_workers){
      assert.ok(err.indexOf('No widgets field found')>-1);
      done();
    });
  });

  it('should return error if invalid job is found on dashboard', function(done){
    var options = {
      packagesPath: [packagesWithInvalidJob],
      configPath: configPath
    };

    jobs_manager.get_jobs(options, function(err, job_workers){
      assert.ok(err);
      done();
    });
  });

  it('should have tasks', function(done){
    var options = {
      packagesPath: [packagesLocalFolder],
      configPath: configPath
    };

    jobs_manager.get_jobs(options, function(err, job_workers){
      assert.ok(!err);
      job_workers.forEach(function(job){
        assert.ok(typeof job.task === "function" );
      });
      done();
    });
  });

  it('should have config', function(done){
    var options = {
      packagesPath: [packagesLocalFolder],
      configPath: configPath
    };

    jobs_manager.get_jobs(options, function(err, job_workers){
      assert.ok(!err);
      // job_conf1 is defined in general config file (shared config)
      // the rest of them are defined in the related dashboard file.
      job_workers.forEach(function(job){
        assert.ok(job.config.interval);
      });
      done();
    });
  });

  it('should be able to extend global config file with custom dashboards properties', function(done){
    var options = {
      packagesPath: [packagesLocalFolder],
      configPath: configPath
    };

    jobs_manager.get_jobs(options, function(err, job_workers){
      assert.ok(!err);
      // job_conf1 should have some properties from the global config files
      // and other properties from the dashboard file
      var jobsWithJob1Config = job_workers.filter(function(job){return job.widget_item.config === "job1_conf";});

      assert.equal(3, jobsWithJob1Config.length);

      // test_dasboard1 has aditional "other_configuration_option_to_extend_test_dashboard1" config key
      assert.ok(jobsWithJob1Config[0].config.interval);
      assert.ok(jobsWithJob1Config[0].config.other_configuration_option_to_extend_test_dashboard1);
      assert.ok(!jobsWithJob1Config[0].config.other_configuration_option_to_extend_test_dashboard2);

      // test_dasboard1 has aditional "other_configuration_option_to_extend_test_dashboard2" config key
      assert.ok(jobsWithJob1Config[1].config.interval);
      assert.ok(!jobsWithJob1Config[1].config.other_configuration_option_to_extend_test_dashboard1);
      assert.ok(jobsWithJob1Config[1].config.other_configuration_option_to_extend_test_dashboard2);

      // other_test_dashboard2 doesn´t have any of those
      assert.ok(jobsWithJob1Config[2].config.interval);
      assert.ok(!jobsWithJob1Config[2].config.other_configuration_option_to_extend_test_dashboard1);
      assert.ok(!jobsWithJob1Config[2].config.other_configuration_option_to_extend_test_dashboard2);

      done();
    });
  });

  it('should have independent states for each job', function(done){
    var options = {
      packagesPath: [packagesNoSharedStateForJobs],
      configPath: configPath
    };

    jobs_manager.get_jobs(options, function(err, job_workers){
      assert.ok(!err, err);
      assert.equal(2, job_workers.length);
      job_workers[0].task(null, null, function(err, data){
        assert.ok(!data);
        job_workers[1].task(null, null, function(err, data){
          assert.ok(!data);
          done();
        });
      });
    });
  });

  it('should not work with an invalid global config file', function(done){
    var options = {
      packagesPath: [packagesNoSharedStateForJobs],
      configPath: invalidConfigPath
    };

    jobs_manager.get_jobs(options, function(err, job_workers){
      assert.ok(err);
      done();
    });
  });

  it('should not work with an global config file with wrong structure', function(done){
    var options = {
      packagesPath: [packagesNoSharedStateForJobs],
      configPath: validJsonWithInvalidFormatConfigPath
    };

    jobs_manager.get_jobs(options, function(err, job_workers){
      assert.ok(err);
      done();
    });
  });

  it('should work with no global config file', function(done){
    var options = {
      packagesPath: [packagesNoSharedStateForJobs],
      configPath: noExistentConfigPath
    };

    jobs_manager.get_jobs(options, function(err, job_workers){
      assert.ok(!err, err);
      done();
    });
  });


});