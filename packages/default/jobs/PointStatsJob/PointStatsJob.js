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
    
    //build the URL
    var url = config.pivotalTrackerServer + "/services/v5/projects/" + config.projectId + "/iterations?scope=current"
    
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

        function GetTotalIterNumber(callback) {
            dependencies.request(options, function (err, response, body) {
                if (err || !response || response.statusCode != 200) {
                    var err_msg = err || "ERROR: Couldn't access the web page at " + options.url;
                    logger.error(err_msg);
                    if (cashedFlag) {
                        job_callback(null, { title: config.widgetTitle, stats: cashedData });
                    } else {
                        job_callback(err_msg); }
                } else {
                    var result = JSON.parse(body);
                    
                    var curr_iter_num = result[0].number;
                    
                    callback(null, curr_iter_num)

                }
            });
        },

        function GetResultsObj(curr_iter_num, callback) {
            var limit = 3;  // limit to last 3 past iteration.
            var offset = curr_iter_num - limit - 1;
            if (offset <= 0) {
                offset = 1;
            }
            options.url = config.pivotalTrackerServer + "/services/v5/projects/" + config.projectId + "/iterations?limit=" + limit.toString() + "&offset=" + offset.toString();
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
                    callback(null, result)
                }
            });
        },

        function GetStoryMap(result, callback) {
            var stories_list = [];
            // each iteration requested
            result.forEach(function (iter) {
                // each story in an iteration
                iter.stories.forEach(function (story) {
                    var story_map = {};
                    story_map["id"] = story.id
                    story_map["type"] = story.story_type
                    if (story.estimate) {
                        story_map["estimate"] = story.estimate;
                    }else {
                        story_map["estimate"] = 0;
                    }
                    stories_list.push(story_map)
                });
            });
            callback(null, stories_list)
        },

        function AddStoryActivities(stories_list, callback) {
            async.eachSeries(stories_list,
        function (story, callback) {
                options.url = config.pivotalTrackerServer + "/services/v5/projects/" + config.projectId + "/stories/" + story.id + "/activity";
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
                        story.response = JSON.parse(body);
                        setTimeout(callback, 1000);
                    }
                });
            },
        function (err) {
                callback(null, stories_list)
            }
);

        },
            
        function CaluStats(stories_list, callback) {
            var iterations_num = 3;  // limit to last 3 past iteration.
            var reject_count = 0;
            var rejected_point = 0;
            var rejected_story_count = 0;
            var finished_story_pt = 0;
            var total_story_pt = 0;
            var total_story_count = 0;
            var finished_story_count = 0;
            var rej_pt_ratio = 0;
            var rej_story_ratio = 0;
            var avg_velocity = 0;
            var story_type;
            stories_list.forEach(function (story) {
                
                var story_activity_response = story.response;
                
                // all changes in one story
                var start_flag = false;
                var accept_flag = false;
                var deliver_flag = false;
                var rejected_flag = false;
                
                for (i = story_activity_response.length - 1; i >= 0; i--) {
                    var highlight = story_activity_response[i].highlight;
                    // if highlight is rejected, then reject counter + 1 and all flag reset to false
                    if (highlight == "rejected") {
                        reject_count += 1;
                        if (!rejected_flag) {
                            rejected_point += story.estimate;
                            rejected_flag = true;
                            rejected_story_count += 1;
                        }
                        start_flag = false;
                        accept_flag = false;
                        deliver_flag = false;
                    }
                    // if the story has not been accepted or submitted, then just starts it.
                    if (highlight == "started" && !accept_flag && !deliver_flag) {
                        start_flag = true;
                    }
                    // if the story was accepted or submitted, restarts it means there is an issue or bug, so reject + 1 and reset submit and accept flags
                    if (highlight == "started" && (accept_flag || deliver_flag)) {
                        reject_count += 1;
                        if (!rejected_flag) {
                            rejected_point += story.estimate;
                            rejected_flag = true;
                            rejected_story_count += 1;
                        }
                        start_flag = true;
                        accept_flag = false;
                        deliver_flag = false;
                    }
                    // if highligt is delivered or finished or done, then it has been submitted.
                    if (highlight == "delivered" || highlight == "finished" || highlight == "done") {
                        deliver_flag = true;
                    }
                    // if highligt is accepted, then for now it is accepted.
                    if (highlight == "accepted") {
                        if (i == 0) {
                            finished_story_pt += story.estimate;
                            finished_story_count += 1;
                        }
                            else { accept_flag = true; }
                    }

                }// end of activity loop in each story
               
            });//end of stories for loop
            
            if (finished_story_count != 0) {
                rej_story_ratio = ((rejected_story_count / finished_story_count) * 100).toFixed(1);
            }else {
                rej_story_ratio = 0;
            }
            if (finished_story_pt != 0) {
                rej_pt_ratio = ((rejected_point / finished_story_pt) * 100).toFixed(1);
                avg_velocity = finished_story_pt / iterations_num;
            }else {
                rej_pt_ratio = 0;
                avg_velocity = 0
            }
            if (stories_list.length > 0) {
                stats = [{ "statsType" : "Point/Story Accepted", "value" : { "point": finished_story_pt.toString(), "story": finished_story_count.toString() } },
        { "statsType" : "Point/Story Rejected", "value" : { "point": rejected_point.toString(), "story": rejected_story_count.toString() } },
        { "statsType" : "Rejected Point/Story Ratio", "value" : { "point": rej_pt_ratio.toString().concat('%'), "story": rej_story_ratio.toString().concat('%') } }];
            
                callback(null, stats)
            }else {
                stats = [];
                callback(null, stats)
            }
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