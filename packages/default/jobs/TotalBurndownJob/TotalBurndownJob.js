/**
 * Job: TotalBurndownJob
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

        if (internalStartDate.getUTCDay() == 1) {
            dayCount++;
        }

        internalStartDate = internalStartDate.addDays(1);
    }

    return dayCount;
}

function BuildLabels(iterationData) {
    var labels = [];

    var startDate = new Date(iterationData.startDate);
    var endDate = new Date(iterationData.endDate);

    //set the start params
    labels.push((startDate.getMonth() + 1) + '/' + startDate.getDate());

    var date = new Date(startDate);
    date = date.addDays(1);

    var diff = WorkdaysBetween(startDate, endDate);

    while (date < endDate) {

        if (date.getDay() == 1) {
            labels.push((date.getMonth() + 1) + '/' + date.getDate());
        }

        date = date.addDays(1);
    }

    //add the last work day
    labels.push((endDate.getMonth() + 1) + '/' + endDate.getDate());

    return labels;
}

function BuildBaseline(iterationData) {

    var baseline = [];

    var startDate = new Date(iterationData.startDate);
    var endDate = new Date(iterationData.endDate);

    baseline.push(iterationData.totalPoints);

    var date = new Date(startDate);
    date = date.addDays(1);

    var diff = WorkdaysBetween(startDate, endDate);

    var daily = iterationData.totalPoints / diff;

    var runningTally = iterationData.totalPoints - daily;

    while (date < endDate) {

        if (date.getDay() == 1) {
            baseline.push(Math.round(runningTally));
            runningTally = runningTally - daily;
        }

        date = date.addDays(1);
    }

    //add the last work day
    baseline.push(0);

    return baseline;
}

function BuildBurndownLine(totalPoints, acceptedPoints, startDate, lastUpdate, burndownData) {

    var burndown = [];
    var currentTime = new Date();
    var pointsLeft = totalPoints - acceptedPoints;

    //copy over the history 
    if (burndownData) {
        burndown = burndownData;
    }
    else {
        //there's no data, pad how far we are into iteration
        var diff = WorkdaysBetween(startDate, currentTime);
        diff = Math.floor(diff / 7);

        for (i = 0; i < diff; i++) {
            burndown.push(pointsLeft);
        }

        //add an extra item to account for today
        burndown.push(pointsLeft);
    }

    var date = {};

    //if a lastUpdate time has been set, use it, otherwise, just use the current time
    if (lastUpdate) {
        date = new Date(lastUpdate);
    }
    else {
        date = new Date();
    }

    if (date.getDate() + 6 >= currentTime.getDate()) {
        //we've already updated today, so just replace the last value
        burndown.pop();
        burndown.push(pointsLeft);
    }
    else {
        //updating on a different day, add a new value
        burndown.push(pointsLeft)
    }

    return burndown;
}


module.exports = function (config, dependencies, job_callback) {

    var logger = dependencies.logger;
    var storage = dependencies.storage;
    var async = require("async");

    //build the URL
    var url = config.pivotalTrackerServer + "/services/v5/projects/" + config.projectId + "/iterations?scope=current_backlog";

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

            storage.get('cachedResults', callback);
        },

        //Do initial processing on the loaded data
        function ProcessLoadedData(data, callback) {

            if (data == undefined) {
                //there is no historical data, go ahead and process normally
                callback();
            }
            else {

                //there is historical data present, return it to the UI
                job_callback(null, { title: config.widgetTitle, result: data });
                dataSent = true;
                cashedData = data;
                cashedFlag = true;
                //continue refreshing in the background                
                callback();
            }
        },

        //pause for a bit to spread out initial load
        function PauseLoading(callback) {

            //pause up to 15 seconds
            var pauseTime = Math.floor(Math.random() * 15000);
            setTimeout(callback, pauseTime);
        },

        //get iteration stats from pivotal tracker
        function GetIterationStatistics(callback) {
            dependencies.request(options, function (err, response, body) {
                if (err || !response || response.statusCode != 200) {
                    var err_msg = err || "ERROR: Couldn't access the web page at " + options.url;
                    logger.error(err_msg);
                    if (cashedFlag) {
                        job_callback(null, { title: config.widgetTitle, result: cashedData });
                    } else {
                        job_callback(err_msg);
                    }
                }
                else {
                    var result = JSON.parse(body);

                    var iterationData = {};
                    iterationData.startDate = result[0].start;
                    iterationData.endDate = result[result.length - 1].finish;
                    iterationData.totalPoints = 0;

                    var stories = result[0].stories;
                    for (var i = 1; i < result.length; i += 1) {
                        for (var j = 0; j < result[i].stories.length; j += 1) {
                            stories.push(result[i].stories[j]);
                        }
                    }
                    

                    iterationData.pointsAccepted = 0;

                    stories.forEach(function (story) {

                        if (story.estimate) {

                            iterationData.totalPoints += story.estimate;

                            if (story.current_state == "accepted") {
                                iterationData.pointsAccepted += story.estimate;
                            }
                        }
                    });

                    callback(null, iterationData);
                }
            });
        },

        //load the saved iteration stats from Disk
        function LoadIterationBurndownStatistics(iterationData, callback) {

            var burndownStats = {};

            burndownStats.iterationData = iterationData;

            //load burndown stats
            storage.get('burndownData', function (err, data) {
                if (data == undefined) {
                    //no stored data exists
                    burndownStats.savedData = null;
                }
                else {
                    burndownStats.savedData = data;
                }

                callback(null, burndownStats);
            });
        },

        //Process the stats
        function ProcessBurndownStatistics(burndownStats, callback) {

            var refreshData = false;

            //if there is no saved data, start from scratch
            if (burndownStats.savedData == null) {
                refreshData = true;
            }

            if (refreshData == false) {
                //savedData isn't null(see above), so see if we're working on a new iteration
                if (burndownStats.savedData.startDate != burndownStats.iterationData.startDate) {
                    //diferrent start dates, refresh the data
                    refreshData = true;
                }
            }

            //This is a new iteration, start from scratch
            if (refreshData == true) {
                burndownStats.savedData = {};
                burndownStats.savedData.labels = BuildLabels(burndownStats.iterationData);
                burndownStats.savedData.baseline = BuildBaseline(burndownStats.iterationData);
                burndownStats.savedData.startDate = burndownStats.iterationData.startDate;
            }

            //store the current point count
            burndownStats.savedData.burndownData = BuildBurndownLine(burndownStats.iterationData.totalPoints,
                                                            burndownStats.iterationData.pointsAccepted,
                                                            burndownStats.iterationData.startDate,
                                                            burndownStats.savedData.lastUpdate,
                                                            burndownStats.savedData.burndownData);

            //Set last update time to the Monday of that week.
            //Allows the graph to create a new point only when a new week starts
            var last = new Date();
            if (last.getDay != 1) {
                last.setDate(last.getDate() - last.getDay() + 1);
            }
            //Store the last update time
            burndownStats.savedData.lastUpdate = last.getTime();

            callback(null, burndownStats.savedData);

        },

        //Save the stats to disk
        function SaveIterationBurndownStatistics(burndownData, callback) {
            //store the results
            storage.set('burndownData', burndownData, function (err, data) {

                callback(null, burndownData);

            });
        },

        //save the results to return more quickly next time around
        function SaveData(stats, callback) {

            //store the results
            storage.set('cachedResults', stats, function (err, data) {

                job_callback(null, { title: config.widgetTitle, result: stats });
                callback();

            });
        }

    ]);

};
