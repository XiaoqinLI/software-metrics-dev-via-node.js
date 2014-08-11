/**
 * Job: IterationBurndownJob
 *
 * Expected configuration:
 * 
 * { }
 */


Date.prototype.addDays = function (days) {
    var dat = new Date(this.valueOf());
    dat.setDate(dat.getDate() + days);
    return dat;
}

function WorkdaysBetween(startDate, endDate) {

    var internalStartDate = new Date(startDate);
    var internalEndDate = new Date(endDate);

    internalStartDate.setHours(0, 0, 0, 0);
    internalEndDate.setHours(0, 0, 0, 0);

    var dayCount = 0;

    while (internalStartDate < internalEndDate) {        
        dayCount++;
        internalStartDate = internalStartDate.addDays(1);
    }
    return dayCount;
}

function BuildLabels(iterationData) {
    var labels = [];

    var startDate = new Date(iterationData.startDate);
    var endDate = new Date(iterationData.endDate);
    var date = new Date(startDate);

    labels.push((date.getMonth() + 1) + '/' + date.getDate());


    var diff = WorkdaysBetween(startDate, endDate);

    for (var i = 1; i <= diff; i++) {
        date = date.addDays(1);
        labels.push((date.getMonth() + 1) + '/' + date.getDate());
    }

    //add the last work day
    //labels.push((endDate.getMonth()+1) + '/' + endDate.getDate());

    return labels;
}

function BuildBaseline(currentVelocity, totalRemainingPoint, startDate, endDate) {

    var baseline = [];

    var date = new Date(startDate);
    var targetburnDown = currentVelocity;
    var currentleft = totalRemainingPoint

    baseline.push(currentleft);

    var diff = WorkdaysBetween(startDate, endDate);
    if (targetburnDown <= currentleft) {
            var daily = targetburnDown / diff;
    } else { var daily = currentleft / diff; }

    var runningTally = currentleft;
  //  var tempAccumulation = 0
    for (var i = 1; i <= diff; i++) {
        runningTally = runningTally - daily;
        baseline.push(Math.round(runningTally));
    }
    
    return baseline;
}

function BuildBurndownLine(resultsData) {
    
    var burndown = [];
    var currentTime = new Date();
    var pointsLeft = resultsData.totalRemainingPoint
    burndown.push(pointsLeft);  
    var diff = WorkdaysBetween(resultsData.startDate, resultsData.currentTime);
    var startDate = new Date(resultsData.startDate);
    var dateIndex = startDate.getDay();
    var runningTally = pointsLeft;

    resultsData.currentIterationData.stories.forEach(function (story) {
        if (story.current_state == "accepted" && story.story_type == "feature") {
            var storyAcceptedDate = new Date(story.accepted_at);
            var gap = storyAcceptedDate.getDay() - dateIndex;
            if (gap == 0) {               
                runningTally -= story.estimate;              
            } else {
                if (gap == 1) {
                    burndown.push(runningTally)
                    runningTally -= story.estimate;
                    dateIndex += gap;
                }
                else if (gap > 1) {                   
                    for (var k = 0; k < gap; k++) {
                        burndown.push(runningTally)
                    }
                    runningTally -= story.estimate;
                    dateIndex += gap;
                }
            }
        }

    });

    var diff = WorkdaysBetween(resultsData.startDate, currentTime)+1;

    var currentSize = burndown.length;
    var lastPushed = burndown[currentSize - 1];

    for (i = currentSize; i < diff; i++) {
        burndown.push(lastPushed);
    }
    
    //add an extra item to account for today
    burndown.push(runningTally);
 
    return burndown;
}

module.exports = function(config, dependencies, job_callback) {

    var logger = dependencies.logger;
    var storage = dependencies.storage;
    var async = require("async");

    //build the URL
    var offset = 0
    var url = config.pivotalTrackerServer + "/services/v5/projects/" + config.projectId + "/iterations?limit=50";

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
                    job_callback(null, { title: config.widgetTitle, results: data.stats });
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
                        job_callback(null, { title: config.widgetTitle, results: cashedData });
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

        function GetAllItersss(allIters, callback) {
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
                                job_callback(null, { title: config.widgetTitle, results: cashedData });
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

        function getRemainingPoint(alliters, callback) {

            var resultMap = {};
            var totalRemainingPoint = 0;
            var currentTime = new Date();
            var currentIterNum = 0
            //get the current iteration
            for (var i = 0; i < alliters.length; i += 1) {
                var start = new Date(alliters[i].start);
                var end = new Date(alliters[i].finish);
                if (start <= currentTime && end > currentTime) {
                    currentIterNum = i;
                }
            }

            // get all reamining points for now
            for (var i = 0; i < alliters.length; i += 1) {
                for (var j = 0; j < alliters[i].stories.length; j += 1) {
                    if (alliters[i].stories[j].estimate && alliters[i].stories[j].current_state != "accepted") 
                    {
                        totalRemainingPoint += alliters[i].stories[j].estimate;
                    }
                }
            }

            // also add points accepted in current iteration to total remaining points

            for (var i = 0; i < alliters[currentIterNum].stories.length; i += 1) {
                if (alliters[currentIterNum].stories[i].estimate && alliters[currentIterNum].stories[i].current_state == "accepted") {
                    totalRemainingPoint += alliters[currentIterNum].stories[i].estimate;
                }
            }
            resultMap.totalRemainingPoint = totalRemainingPoint;
            resultMap.currentIterNum = currentIterNum
            /*
            var currentTime = new Date();
            //get the current iteration
            for (var i = 0; i < alliters.length; i += 1) {
                start = new Date(alliters[i].start);
                end = new Date(alliters[i].finish);
                if (start <= currentTime && end > currentTime) {
                    currentIter = i;
                }
            }
            */            
            callback(null, resultMap);
        },

        function GetCurrVelocity(resultMap, callback) {

            options.url = config.pivotalTrackerServer + "/services/v5/projects/" + config.projectId + "/?fields=current_velocity";
            dependencies.request(options, function (err, response, body) {
                if (err || !response || response.statusCode != 200) {
                    var err_msg = err || "ERROR: Couldn't access the web page at " + options.url;
                    logger.error(err_msg);
                    if (cashedFlag) {
                        job_callback(null, { title: config.widgetTitle, results: cashedData });
                    } else {
                        job_callback(err_msg);
                    }
                }
                else {
                    var result = JSON.parse(body);
                    resultMap.currentVelocity = result.current_velocity
                    callback(null, resultMap);
                }
            });
        },

        //get iteration stats from pivotal tracker
        function GetCurrentIteration(resultMap, callback) {
            options.url = config.pivotalTrackerServer + "/services/v5/projects/" + config.projectId + "/iterations?scope=current";
            dependencies.request(options, function (err, response, body) {
                if (err || !response || response.statusCode != 200) {
                    var err_msg = err || "ERROR: Couldn't access the web page at " + options.url;
                    logger.error(err_msg);
                    if (cashedFlag) {
                        job_callback(null, { title: config.widgetTitle, results: cashedData });
                    } else {
                        job_callback(err_msg);
                    }
                }
                else {
                    var result = JSON.parse(body);

                    var iterationData = {};
                    iterationData.startDate = result[0].start;
                    iterationData.endDate = result[0].finish;
                    iterationData.totalPoints = 0; // total points in current iteration
                    iterationData.pointsAccepted = 0; // accepted points in current iteration
                    iterationData.stories = result[0].stories;

                    result[0].stories.forEach(function (story) {
                        if (story.estimate) {
                            iterationData.totalPoints += story.estimate;

                            if (story.current_state == "accepted") {
                                iterationData.pointsAccepted += story.estimate;
                            }
                        }
                    });
                    resultMap.currentIterationData = iterationData
                    callback(null, resultMap);
                }
            });
        },
        //-----------------now I am here--------------------------------------
        //Process the stats
        function ProcessBurndownStatistics(resultMap, callback) {
                
            resultMap.savedData = {};
            resultMap.startDate = resultMap.currentIterationData.startDate;
            resultMap.endDate = resultMap.currentIterationData.endDate;
            resultMap.savedData.labels = BuildLabels(resultMap.currentIterationData);
            resultMap.savedData.baseline = BuildBaseline(resultMap.currentVelocity, resultMap.totalRemainingPoint, resultMap.startDate, resultMap.endDate);
            
            //store the current point count
            resultMap.savedData.burndownData = BuildBurndownLine(resultMap);

            callback(null, resultMap.savedData);

        },

        //save the results to return more quickly next time around
        function SaveData(stats, callback) {

            var results = {};

            results.stats = stats;
            results.lastResultUpdate = new Date();

            //store the results
            storage.set('cachedResults', results, function (err, data) {

                job_callback(null, { title: config.widgetTitle, results: results.stats });
                callback();

            });
        }

    ]);

};
