/**
 * Job: IterationStatusJob
 *
 * Expected configuration:
 * 
 * { }
 */
var async = require("async");

module.exports = function(config, dependencies, job_callback) {

    var logger = dependencies.logger;
    var storage = dependencies.storage;

    //build the URL
    var url = config.pivotalTrackerServer + "/services/v5/projects/" + config.projectId + "/iterations?scope=current";

    var options = {
        url: url,
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
                    job_callback(null, { title: config.widgetTitle, status: data.stats });
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

        function GetMilestones(callback) {

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

                    var statusData = {};
                    statusData.startDate = result[0].start;
                    statusData.endDate = result[0].finish;

                    var stories = result[0].stories;

                    statusData.unestimatedItems = 0;
                    statusData.pointsUnstarted = 0;
                    statusData.pointsStarted = 0;
                    statusData.pointsDelivered = 0;
                    statusData.pointsFinished = 0;
                    statusData.pointsRejected = 0;
                    statusData.pointsAccepted = 0;

                    stories.forEach(function (story) {

                        if (story.estimate == 0) {
                            statusData.unestimatedItems++;
                        }

                        if (story.estimate) {

                            if (story.current_state == "unstarted") {
                                statusData.pointsUnstarted += story.estimate;
                            }

                            if (story.current_state == "started") {
                                statusData.pointsStarted += story.estimate;
                            }

                            if (story.current_state == "delivered") {
                                statusData.pointsDelivered += story.estimate;
                            }

                            if (story.current_state == "finished") {
                                statusData.pointsFinished += story.estimate;
                            }

                            if (story.current_state == "rejected") {
                                statusData.pointsRejected += story.estimate;
                            }

                            if (story.current_state == "accepted") {
                                statusData.pointsAccepted += story.estimate;
                            }
                        }
                    });

                    var item = statusData.startDate;

                    callback(null, statusData );
                }
            });
        },


        function SaveData(stats, callback) {

            var results = {};

            results.stats = stats;
            results.lastResultUpdate = new Date();

            //store the results
            storage.set('cachedResults', results, function (err, data) {

                job_callback(null, { title: config.widgetTitle, status: results.stats });
                callback();

            });
        }




    ]);



};
