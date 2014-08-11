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

    var cashedData;
    var cashedFlag = false;
    var dataSent = false;

    async.waterfall([

        //load cached data from disk
        //load cached data from disk
        function LoadData(callback) {

            storage.get('cachedResults', function (err, data) {

                if (data == undefined) {
                    //there is no historical data, go ahead and process normally
                    callback();
                }
                else {

                    //there is historical data present, return it to the UI
                    job_callback(null, { title: config.widgetTitle, result: data.stats });
                    dataSent = true;

                    var currentTime = new Date();
                    var lastResult = Date.parse(data.lastResultUpdate);
                    var diff = currentTime - lastResult;;

                    if (diff < config.interval) {
                        callback("Skipping polling, using background data");
                    }
                    else {
                        cashedData = data.stats;
                        cashedFlag = true;
                        //continue refreshing in the background                
                        callback();
                    }

                }
            });
        },

        //pause for a bit to spread out initial load
        function PauseLoading(callback) {

            //pause up to 15 seconds
            var pauseTime = Math.floor(Math.random() * 15000);
            setTimeout(callback, pauseTime);
        },

        function GetLatestBuildId(callback) {

            dependencies.request(options, function (err, response, body) {
                if (err || !response || response.statusCode != 200) {
                    var err_msg = err || "ERROR: Couldn't access the web page at " + options.url;
                    logger.error(err_msg);
                    if (cashedFlag) {
                        job_callback(null, { title: config.widgetTitle, stats: cashedData });
                    } else {
                        job_callback(err_msg);
                    }
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
                    if (cashedFlag) {
                        job_callback(null, { title: config.widgetTitle, stats: cashedData });
                    } else {
                        job_callback(err_msg);
                    }
                }
                else {
                    var result = JSON.parse(body);

                    var statementCoverage = {};

                    //search for the proper property
                    result.property.forEach(function (property) {

                        if (property.name == 'CodeCoverageS') {
                            statementCoverage.CodeCoverageS = property.value.substr(0, 5);
                        }
                        if (property.name == 'CodeCoverageM') {
                            statementCoverage.CodeCoverageM = property.value.substr(0, 5);
                        }
                        if (property.name == 'CodeCoverageC') {
                            statementCoverage.CodeCoverageC = property.value.substr(0, 5);
                        }
                    });

                    callback(null, statementCoverage);
                }
            });
        },

        function GetSavedBuildStatistics(statementCoverage, callback) {

            var coverageStats = {};
            if (Object.keys(statementCoverage).length != 0) {
                //load coverage stats(last coverage, last change)
                storage.get('coverageStats', function (err, data) {
                    if (data == undefined) {
                        //no stored data exists
                        coverageStats.coverage = statementCoverage;
                        coverageStats.lastChangeS = 0;
                        coverageStats.lastChangeM = 0;
                        coverageStats.lastChangeC = 0;
                    }
                    else {
                        coverageStats = data;

                        //if coverage is different, calculate percent change
                        if (coverageStats.coverage.CodeCoverageC != statementCoverage.CodeCoverageC) {
                            coverageStats.lastChangeC = (statementCoverage.CodeCoverageC - coverageStats.coverage.CodeCoverageC) / (coverageStats.coverage.CodeCoverageC) * 100;
                            coverageStats.lastChangeC = Math.round(coverageStats.lastChangeC);
                            coverageStats.coverage.CodeCoverageC = statementCoverage.CodeCoverageC;
                        }
                        if (coverageStats.coverage.CodeCoverageM != statementCoverage.CodeCoverageM) {
                            coverageStats.lastChangeM = (statementCoverage.CodeCoverageM - coverageStats.coverage.CodeCoverageM) / (coverageStats.coverage.CodeCoverageM) * 100;
                            coverageStats.lastChangeM = Math.round(coverageStats.lastChangeM);
                            coverageStats.coverage.CodeCoverageM = statementCoverage.CodeCoverageM;
                        }
                        if (coverageStats.coverage.CodeCoverageS != statementCoverage.CodeCoverageS) {
                            coverageStats.lastChangeS = (statementCoverage.CodeCoverageS - coverageStats.coverage.CodeCoverageS) / (coverageStats.coverage.CodeCoverageS) * 100;
                            coverageStats.lastChangeS = Math.round(coverageStats.lastChangeS);
                            coverageStats.coverage.CodeCoverageS = statementCoverage.CodeCoverageS;
                        }
                    }

                    callback(null, coverageStats);
                });
            } else {
                callback(null, coverageStats);
            }
        },

        function SaveBuildStatistics(coverageStats, callback) {
            //store the results
            storage.set('coverageStats', coverageStats, function (err, data) {

                callback(null, coverageStats);

            });
        },

        //save the results to return more quickly next time around
        function SaveData(stats, callback) {

            var results = {};

            results.stats = stats;
            results.lastResultUpdate = new Date();

            //store the results
            storage.set('cachedResults', results, function (err, data) {

                job_callback(null, { title: config.widgetTitle, result: results.stats });
                callback();

            });
        }
    ]);
};