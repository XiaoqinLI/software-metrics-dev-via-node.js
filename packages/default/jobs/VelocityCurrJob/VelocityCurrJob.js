    /**
     * Job: PointStatsJob
     *
     * Expected configuration:
     * 
     * { }
     */
var async = require("async");
module.exports = function (config, dependencies, job_callback) {

    var logger = dependencies.logger;
    var storage = dependencies.storage;

    var options = {
        headers: {
            "X-TrackerToken": config.globalAuth["pivotalTracker"].apiToken
        }
    };

    var cashedData;
    var dataSent = false;
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

        //Get the total number of iterations for the project
        function GetTotalIterNumber(callback) {

            options.url = config.pivotalTrackerServer + "/services/v5/projects/" + config.projectId + "/iterations?scope=current";

            dependencies.request(options, function (err, response, body) {
                if (err || !response || response.statusCode != 200) {
                    var err_msg = err || "ERROR: Couldn't access the web page at " + options.url + ".  Reason: " + body;
                    logger.error(err_msg);
                    if (cashedFlag) {
                        job_callback(null, { title: config.widgetTitle, stats: cashedData });
                    } else {
                        job_callback(err_msg);
                    }
                }
                else {
                    var result = JSON.parse(body);
                    var curr_iter_num = result[0].number;
                    callback(null, curr_iter_num)
                }
            });
        },

        //retrieve most recent set of iterations
        function GetIterations(curr_iter_num, callback) {
            var limit = 3;  // limit to last 3 past iteration.
            var offset = curr_iter_num - limit - 2;
            if (offset <= 0) {
                offset = 1;
            }
            options.url = config.pivotalTrackerServer + "/services/v5/projects/" + config.projectId + "/iterations?limit=" + limit.toString() + "&offset=" + offset.toString();
            dependencies.request(options, function (err, response, body) {
                if (err || !response || response.statusCode != 200) {
                    var err_msg = err || "ERROR: Couldn't access the web page at " + options.url + ".  Reason: " + body;
                    logger.error(err_msg);
                    if (cashedFlag) {
                        job_callback(null, { title: config.widgetTitle, stats: cashedData });
                    } else {
                        job_callback(err_msg);
                    }

                } else {
                    var result = JSON.parse(body);
                    callback(null, result)
                }
            });
        },

        //grab all the stories from the provided iteration and put them into an array
        function BuildStoryArray(result, callback) {

            var stories_list = [];
            // each iteration requested
            result.forEach(function (iter) {

                // each story in an iteration
                iter.stories.forEach(function (story) {
                    stories_list.push(story)
                });
            });

            callback(null, stories_list)
        },

        function CaluStats(stories_list, callback) {
            var iterations_num = 3;  // limit to last 3 past iteration.
            var finishedStoryPointCount = 0;
            var averageVelocity = 0;

            stories_list.forEach(function (story) {

                if (story.current_state == "accepted") {

                    if (story.estimate) {
                        finishedStoryPointCount += story.estimate;
                    }
                }
            })

            averageVelocity = Math.round((finishedStoryPointCount / iterations_num));

            stats = [{ "velocityType": "current", "value": "0" },
            { "velocityType": "previous", "value": averageVelocity.toString() }];

            callback(null, stats);

        },

        function GetCurrentVelocity(stats, callback) {
            options.url = config.pivotalTrackerServer + "/services/v5/projects/" + config.projectId + "/?fields=current_velocity";
            dependencies.request(options, function (err, response, body) {
                if (err || !response || response.statusCode != 200) {
                    var err_msg = err || "ERROR: Couldn't access the web page at " + options.url + ".  Reason: " + body;
                    logger.error(err_msg);
                    if (cashedFlag) {
                        job_callback(null, { title: config.widgetTitle, stats: cashedData });
                    } else {
                        job_callback(err_msg);
                    }
                } else {
                    var result = JSON.parse(body);
                    stats[0].value = result.current_velocity
                    callback(null, stats)
                }
            });
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