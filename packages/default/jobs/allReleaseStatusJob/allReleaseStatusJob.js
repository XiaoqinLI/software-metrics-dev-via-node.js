/**
 * Job: ReleaseStatusJob
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
    var offset = 0
    var url = config.pivotalTrackerServer + "/services/v5/projects/" + config.projectId + "/iterations?limit=50";

    var options = {
        url: url,
        headers: {
            "X-TrackerToken": config.globalAuth["pivotalTracker"].apiToken,
            "Accept": 'application/json',
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

        function GetFirst50Iters(callback) {
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
                    var allIters = JSON.parse(body);
                    callback(null, allIters);
                }
            });
        },

        function GetAllItersss(allIters,callback) {
            var offset = 0;
            var count = allIters.length
            async.whilst(
                function () { return count == 50; },
                function (callback) {
                    offset += 50;
                    options.url = config.pivotalTrackerServer + "/services/v5/projects/" + config.projectId + "/iterations?limit=50&offset=" + offset.toString();
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
                         allIters = allIters.concat(temp);
                         count = temp.length;                      
                         setTimeout(callback, 1000);
                     }
                    });
                },
                function (err) {
                    callback(null, allIters);
                }
            );
            
         },

        function GetAllReleaseStats(allIters, callback) {
             
            var statusData = {};
            
            allIters.forEach(function (iter) {
                iter.stories.forEach(function (story) {
                    if (story.story_type == "feature") {
                        if (story.labels.length != 0) {
                            story.labels.forEach(function (label) {
                                if (label.name in statusData) {
                                    if (story.current_state == "accepted") {
                                        statusData[label.name][0] += story.estimate;
                                        statusData[label.name][1] += story.estimate;
                                    }
                                    else {
                                        if ("estimate" in story) {
                                            statusData[label.name][0] += story.estimate;
                                            statusData[label.name][2] += story.estimate;
                                        }
                                        else {
                                            statusData[label.name][0] += 0;
                                            statusData[label.name][2] += 0;
                                        }
                                    }
                                }
                                else {
                                    statusData[label.name] = [0, 0, 0];
                                    if (story.current_state == "accepted") {
                                        statusData[label.name][0] += story.estimate;
                                        statusData[label.name][1] += story.estimate;
                                    }
                                    else {
                                        if ("estimate" in story) {
                                            statusData[label.name][0] += story.estimate;
                                            statusData[label.name][2] += story.estimate;
                                        }
                                        else {
                                            statusData[label.name][0] += 0;
                                            statusData[label.name][2] += 0;
                                        }


                                    }
                                }
                            });// end of labels loop
                        }
                        else {
                            if ("unLabeled" in statusData) {
                                    if (story.current_state == "accepted") {
                                        statusData["unLabeled"][0] += story.estimate;
                                        statusData["unLabeled"][1] += story.estimate;
                                    }
                                    else {
                                        if ("estimate" in story) {
                                            statusData["unLabeled"][0] += story.estimate;
                                            statusData["unLabeled"][2] += story.estimate;
                                        }
                                        else {
                                            statusData["unLabeled"][0] += 0;
                                            statusData["unLabeled"][2] += 0;
                                        }
                                    }
                                }
                                else {
                                statusData["unLabeled"] = [0, 0, 0];
                                    if (story.current_state == "accepted") {
                                        statusData["unLabeled"][0] += story.estimate;
                                        statusData["unLabeled"][1] += story.estimate;
                                    }
                                    else {
                                        if ("estimate" in story) {
                                            statusData["unLabeled"][0] += story.estimate;
                                            statusData["unLabeled"][2] += story.estimate;
                                        }
                                        else {
                                            statusData["unLabeled"][0] += 0;
                                            statusData["unLabeled"][2] += 0;
                                        }
                                    }
                                }
                        }
                    }
                });// end of stories loop

            });// end of all iters loop
            //job_callback(null, { title: config.widgetTitle, status: statusData });
            callback(null, statusData)           
        },

         function GetAllReleaseStats(statusData, callback) {
             options.url = config.pivotalTrackerServer + "/services/v5/projects/" + config.projectId + "/?fields=current_velocity";
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
                     var result = JSON.parse(body);
                     var status = {}
                     status["currVelocity"] = result.current_velocity;
                     status["statusData"] = statusData;
                     callback(null, status)
                 }
             });
         },
         function SaveData(status, callback) {
             var results = {};

             results.stats = status;
             results.lastResultUpdate = new Date();

             //store the results
             storage.set('cachedResults', results, function (err, data) {

                 job_callback(null, { title: config.widgetTitle, stats: results.stats });
                 callback();
             });
             }
         ]);
};
