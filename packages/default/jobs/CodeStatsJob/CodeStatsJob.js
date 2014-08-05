/**
 * Job: CodeStatsJob
 *
 * Expected configuration:
 * 
 * { }
 */
module.exports = function (config, dependencies, job_callback) {
var async = require("async");
    var logger = dependencies.logger;
    var storage = dependencies.storage;
    var url =  config.gitHubServer + "/" + config.gitHubAccountId + "/" + config.repoId + "/commits?per_page=100"
    var options = {
        pageNumber: 1,
        url: url,
        auth: 
            {
                user: config.globalAuth["github"].username,
                pass: config.globalAuth["github"].password,
                sendImmediately: true
            },
        headers: {
            "Accept": 'application/json',
            "User-Agent": 'DLPStatusBoard',
            "curl": '-i',
            "Authorization": config.globalAuth["github"].access_token
        }
    };

    var dataSent = false;
    var cashedData;
    var cashedFlag = false;

    async.waterfall([
        //load cached data from disk
        function LoadData(callback) {

            storage.get('cachedResults', function (err, data) {

                if (data == undefined) {
                    //there is no historical data, go ahead and process normally
                    callback();
                }
                else {

                    //there is historical data present, return it to the UI
                    job_callback(null, { title: config.widgetTitle, stats: data.stats });
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

        function GetLast100CommitsMap(callback) {
            dependencies.request(options, function (err, response, body) {
                if (err || !response || response.statusCode != 200) {
                    var err_msg = err || "ERROR: Couldn't access the web page at " + options.url;
                    logger.error(err_msg);
                    if (cashedFlag) {
                        job_callback(null, { title: config.widgetTitle, stats: cashedData });
                    } else {
                        job_callback(err_msg);
                    }
                } else {

                    var commitsMap = JSON.parse(body);

                    callback(null, commitsMap)

                }
            });
        },

        function GetAllCommitsMap(commitsMap, callback) {
            var page = 1;
            var count = commitsMap.length
            async.whilst(
                function () { return count == 100; },
                function (callback) {
                    page += 1;
                    options.url = config.gitHubServer + "/" + config.gitHubAccountId + "/" + config.repoId + "/commits?per_page=100&page=" + page.toString();

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
                            var temp = JSON.parse(body);
                            commitsMap = commitsMap.concat(temp);
                            count = temp.length;
                            setTimeout(callback, 1000);
                        }
                    });
                },
                function (err) {
                    callback(null, commitsMap);
                }
            );
        },

        function AddIndivisualCommits(commitsMap, callback) {
            async.eachSeries(commitsMap,
        function (individualCommit, callback) {
            options.url = config.gitHubServer + "/" + config.gitHubAccountId + "/" + config.repoId + "/commits/" + individualCommit.sha
            dependencies.request(options, function (err, response, body) {
                if (err || !response || response.statusCode != 200) {
                    var err_msg = err || "ERROR: Couldn't access the web page at " + options.url;
                    logger.error(err_msg);
                    if (cashedFlag) {
                        job_callback(null, { title: config.widgetTitle, stats: cashedData });
                    } else {
                        job_callback(err_msg);
                    }
                } else {
                    individualCommit.response = JSON.parse(body);
                    callback();
                }
            });
        },
        function (err) {
            callback(null, commitsMap)
        }
    );

        },

        function filesChangeStats(commitsMap, callback) {
            var totalLineAdded = 0;
            var totalLineRemoved = 0;
            var changeRatio = 0;
            var trackingFileList = ["cs", "java", "cshtml", "scala", "mustache", "js", "css", "scss", "sql", "config", "ois_export"];
            commitsMap.forEach(function (singleCommit) {

                singleCommit.response.files.forEach(function (singleFile) {
                    var filename = singleFile.filename;
                    var endname = filename.split(".")
                    var index = false;
                    for (i = 0; i < trackingFileList.length; i++) {
                        if (trackingFileList[i] == endname[endname.length - 1]) {
                            index = true;
                        }
                    }
                    if (index) {
                        totalLineAdded += singleFile.additions;
                        totalLineRemoved += singleFile.deletions;
                    }

                });
            }); // end of commitesMap forEach loop
            if (totalLineAdded > 0) {
                changeRatio = ((totalLineRemoved / (totalLineAdded)) * 100).toFixed(2);
            }

            stats = [{ "statsType": "LinesAdded", "value": totalLineAdded.toString() },
        { "statsType": "LinesModified", "value": totalLineRemoved.toString() },
        { "statsType": "Modified Ratio", "value": changeRatio.toString().concat('%') }];
            callback(null, stats)
        },

        //save the results to return more quickly next time around
        function SaveData(stats, callback) {

            var results = {};

            results.stats = stats;
            results.lastResultUpdate = new Date();

            //store the results
            storage.set('cachedResults', results, function (err, data) {

                job_callback(null, { title: config.widgetTitle, stats: results.stats });
                callback();

            });
        }
    ]);

};