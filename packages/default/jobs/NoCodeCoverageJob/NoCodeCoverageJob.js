/**
 * Job: NoCodeCoverageJob
 *
 * Expected configuration:
 * 
 * { }
 */

module.exports = function(config, dependencies, job_callback) {
    var text = "No code coverage.";

    // first parameter is error (if any). Second parameter is the job result (if success)

    // you can use the following dependencies:
    // - dependencies.request : request module (https://github.com/mikeal/request)
    // - dependencies.logger : logger interface

    job_callback(null, {title: config.widgetTitle, text: text});
};
