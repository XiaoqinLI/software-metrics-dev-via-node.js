var fs = require('fs'),
    path = require('path'),
    extend = require('xtend'),
    item_manager = require('./item-manager'),
    logger = require('./logger')();

/**
 * Return the dashboard config file based on path
 * 
 * @param  {string} dashboardFilePath dashboard path
 * @return {object} dashboard configuration
 */

function readDashboard (dashboardFilePath){
  var dashboardConfig = JSON.parse(fs.readFileSync(dashboardFilePath));

  if (!dashboardConfig.layout){
    throw('No layout field found in ' + dashboardFilePath);
  }

  if (!dashboardConfig.layout.widgets){
    throw('No widgets field found in ' + dashboardFilePath);
  }
  return dashboardConfig;
}

/**
 * Returns true if dashboard matches a particular regex filter
 * 
 * @param  {string} dashboardFullPath dashboard full path
 * @param  {string} filter regex
 * @return {boolean}
 */

function matchDashboardFilter (dashboardFullPath, filter){
  var dashboardName = path.basename(dashboardFullPath);
  return dashboardName.match(filter);
}

/**
 * Returns true if job matches a particular regex filter
 * 
 * @param  {string} jobName job name
 * @param  {string} filter regex
 * @return {boolean}
 */

function matchJobFilter (jobName, filter){
  return jobName.match(filter);
}

/**
 * Process dashboard, reading all related jobs
 * 
 * @param  {array} allJobs all available jobs
 * @param  {string} dashboardName dashboard name
 * @param  {object} dashboardConfig dashboard config
 * @param  {object} filters filters, if any
 * @return {array} related jobs
 */
function processDashboard (allJobs, dashboardName, dashboardConfig, filters){
  var jobs = [];
  for (var i = 0, l = dashboardConfig.layout.widgets.length; i < l ;  i++) {
    var jobItem = dashboardConfig.layout.widgets[i];
    if (jobItem.job) { // widgets can run without a job, displaying just static html.
      if (filters.jobFilter){
        if (!matchJobFilter(jobItem.job, filters.jobFilter)){
          continue;
        }
      }

      var candidateJobs = item_manager.resolve_candidates(allJobs, jobItem.job, "jobs", ".js");
      if (!candidateJobs.length){
        throw "  ERROR RESOLVING JOB " +
              "\n   No job file found for \"" + jobItem.job + "\" in " + dashboardName +
              "\n   Did you pulled all the packages dependencies? (they are git submodules)" +
              "\n\n   $ git submodule init"+
              "\n   $ git submodule update\n";
      }

      var job = {
        task : require(candidateJobs[0]),
        dashboard_name : path.basename(dashboardName, '.json'),
        widget_item : jobItem,
        job_name : jobItem.job,
        configKey : jobItem.config
      };

      jobs.push(job);
    }
  }
  return jobs;
}


module.exports = {

  /**
   * Return the jobs for all available dashboards in all the packages
   * 
   * @param  {object}   options  options object
   * @param  {Function} callback
   */

  get_jobs : function (options, callback) {

    var packagesPath = options.packagesPath,
        configPath = options.configPath,
        filters = options.filters || {};

    var jobs = [];
    var config_path = path.join(configPath,"/dashboard_common.json");
    var generalDashboardConfig = {};

    // ----------------------------------------------
    // general config is optional, but if it exists it needs to be a valid file
    // ----------------------------------------------
    if (fs.existsSync(config_path)){
      try{
        generalDashboardConfig = JSON.parse(fs.readFileSync(config_path)).config;
        if (!generalDashboardConfig) throw 'invalid format. config property not found';
      }
      catch (e){
        return callback("ERROR reading general config file..." + config_path);
      }
    }

    // ----------------------------------------------
    // get all dashboards from all packages folder
    // ----------------------------------------------
    item_manager.get(packagesPath, "dashboards", ".json", function(err, dashboardConfigFiles){
      if (err){ return callback(err); }

      // ----------------------------------------------
      // get all jobs from those packages
      // ----------------------------------------------
      item_manager.get(packagesPath, "jobs", ".js", function(err, allJobs){
        if (err){ return callback(err); }

        for (var d = 0, dl = dashboardConfigFiles.length; d < dl ; d++) {
          var dashboardFullPath = dashboardConfigFiles[d];

          if (filters.dashboardFilter){
            if (!matchDashboardFilter(dashboardFullPath, filters.dashboardFilter)){
              continue;
            }
          }

          var dashboardConfig;
          var dashboardJobs;
          try {
            dashboardConfig = readDashboard(dashboardFullPath);
            dashboardJobs = processDashboard(allJobs, dashboardFullPath, dashboardConfig, filters);
          }
          catch (e){
            return callback (e);
          }

          // add config to job, extending for the same config key in general config, if any
          dashboardJobs = dashboardJobs.map(function(job){
            job.config = extend(generalDashboardConfig[job.configKey], dashboardConfig.config[job.configKey]);
            return job;
          });

          jobs = jobs.concat(dashboardJobs);
        }

        callback(null, jobs);
      });
    });
  }
};