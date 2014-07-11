/**
 * Job: CodeCoverageJob
 *
 * Expected configuration:
 * 
 * { }
 */

var async = require("async");

module.exports = function (config, dependencies, job_callback) {

    var logger = dependencies.logger;
    var storage = dependencies.storage;

    //build the builds URL
    var url = config.teamcityServer + "/httpAuth/app/rest/buildTypes/id:" + config.buildConfiguration + "/builds";

    var options = {
        url: url,
        auth: 
        {
            user: config.globalAuth["teamcity"].username,
            pass: config.globalAuth["teamcity"].password,
            sendImmediately: true
        },

        headers: {
            "Accept": 'application/json'
        }

    };

    async.waterfall([
        function GetLatestBuildId(callback) {

            dependencies.request(options, function (err, response, body) {
                if (err || !response || response.statusCode != 200) {
                    var err_msg = err || "ERROR: Couldn't access the web page at " + options.url;
                    logger.error(err_msg);
                    callback(err_msg);
                }
                else {
                    var builds = JSON.parse(body);

                    var buildId = builds.build[0].id;

                    callback(null, buildId);
                }
            });
        },

        function GetBuildStatistics(buildId, callback) {
            options.url = config.teamcityServer + "/httpAuth/app/rest/builds/id:" + buildId + "/statistics";
            dependencies.request(options, function (err, response, body) {
                if (err || !response || response.statusCode != 200) {
                    var err_msg = err || "ERROR: Couldn't access the web page at " + options.url;
                    logger.error(err_msg);
                    job_callback(err_msg);
                }
                else {
                    var result = JSON.parse(body);

                    var statementCoverage = {};

                    //search for the proper property
                    result.property.forEach(function (property) {

                        if (property.name == 'CodeCoverageS') {
                            statementCoverage = property.value.substr(0, 5);
                        }
                    });

                    callback(null, statementCoverage);
                }
            });
        },

        function GetSavedBuildStatistics(statementCoverage, callback) {

            var coverageStats = {};

            //load coverage stats(last coverage, last change)
            storage.get('coverageStats', function (err, data) {
                if (data == undefined) {
                    //no stored data exists
                    coverageStats.coverage = statementCoverage;
                    coverageStats.lastChange = 0;
                }
                else {
                    coverageStats = data;

                    //if coverage is different, calculate percent change
                    if (coverageStats.coverage != statementCoverage) {
                        coverageStats.lastChange = (statementCoverage - coverageStats.coverage) / (coverageStats.coverage) * 100;
                        coverageStats.lastChange = Math.round(coverageStats.lastChange);
                        coverageStats.coverage = statementCoverage;
                    }
                }

                callback(null, coverageStats);
            });
        },

        function SaveBuildStatistics(coverageStats, callback) {
            //store the results
            storage.set('coverageStats', coverageStats, function (err, data) {

                callback(null, coverageStats);

            });
        }

    ],

        function(err, status) {
            job_callback(null, { title: config.widgetTitle, result: status });
        }
    );
};