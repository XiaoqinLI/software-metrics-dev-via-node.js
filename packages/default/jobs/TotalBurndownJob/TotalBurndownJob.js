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

function WeeksBetween(startDate, endDate) {

    var internalStartDate = new Date(startDate);
    var internalEndDate = new Date(endDate);

    internalStartDate.setHours(0, 0, 0, 0);
    internalEndDate.setHours(0, 0, 0, 0);

    var weekCount = 0;

    while (internalStartDate < internalEndDate) {

        if (internalStartDate.getUTCDay() == 1) {
            weekCount++;
        }

        internalStartDate = internalStartDate.addDays(1);
    }

    return weekCount;
}

function BuildLabels(iterationData, release) {
    var labels = [];

    var startDate = new Date(release.startDate);
    var currentDate = new Date();
    //get the correct end date
  
    if (release.deadline) {
        var deadline = new Date(release.deadline);
        if (release.current_state == "accepted") {
            var acceptedDate = new Date(release.accepted_at);
            if (acceptedDate < deadline) {
                var endDate = deadline;
            } else { var endDate = acceptedDate; }
        } else {
            if (currentDate < deadline) {
                var endDate = deadline;
            } else { var endDate = currentDate }
            }
    } else {
        var acceptedDate = new Date(release.accepted_at);
        if (release.current_state == "accepted") {
            var endDate = acceptedDate;
        } else { var endDate = currentDate;}
    }

   // endDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() - endDate.getDay() + 1, 0, 0, 0, 0);

    while (endDate.getDay() != 1) {
        endDate = endDate.addDays(1);
    }

    //set the start params
    labels.push((startDate.getMonth() + 1) + '/' + startDate.getDate());

    var date = new Date(startDate);
    date = date.addDays(1);

    var diff = WeeksBetween(startDate, endDate);

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

function ReBuildLabels(labels) {
    if (labels.length >= 40) {
        for (var i = 1; i < labels.length - 1; i++) {
            if (i % 4 != 0) {
                labels[i] = "";
            }
        }
        return labels;
    }
    else if (labels.length >= 30) { 
        for (var i = 1; i < labels.length - 1; i++) {
            if (i%3 != 0){
                labels[i] = "";
            }           
        }
        return labels;
    }
    else if (labels.length >= 10) {
        for (var i = 1; i < labels.length - 1; i++) {
            if (i % 2 != 0) {
                labels[i] = "";
            }
        }
        return labels;
    }
    else { 
        return labels;
        }
}

function BuildBaseline(iterationData, release) {

    var baseline = [];

    var startDate = new Date(release.startDate);
    while (startDate.getDay() != 1) {
        startDate = startDate.addDays(-1);
    }
    var currentDate = new Date();
    var deadline = new Date(release.deadline);
    while (deadline.getDay() != 1) {
        deadline = deadline.addDays(1);
    }

    baseline.push(release.totalPoints);

    //get the number of weeks for the baseline until the deadline
    var diff = WeeksBetween(startDate, deadline);
    if (diff == 0 ){
        baseline.push(0);
        }

    var daily = release.totalPoints / diff;

    var runningTally = release.totalPoints - daily;

    //create the baseline
    while (diff > 0) {
        baseline.push(Math.round(runningTally));
        runningTally = runningTally - daily;
        diff -= 1;
    }

    return baseline;
}

function BuildBurndownLine(iterationData, release) {

    var burndown = [];
    var currentTime = new Date();
    var totalPoints = release.totalPoints;
    var startDate = release.startDate;
    var pointsLeft = totalPoints;

    
    var iter = iterationData.allStories[release.startPoint].iteration; // get iter number of the start of this release
    var currentIter = 0;
    var start;
    var end;

    //add first point
    burndown.push(pointsLeft);

    //get the current iteration
    for (var i = 0; i < iterationData.iterations.length; i += 1) {
        start = new Date(iterationData.iterations[i].start);
        end = new Date(iterationData.iterations[i].finish);
        if (start <= currentTime && end > currentTime) {
            currentIter = i;
        }
    }
    //get the data for the burndown
    for (var i = release.startPoint; i < release.endPoint; i += 1) {
        if (iterationData.allStories[i].iteration != iter) { // if it moves to next iteration, then save remaining points, which is substrcted by all points accepted in this ending iteration
            
            if (iter >= currentIter) { break; }
            else {
                burndown.push(pointsLeft);
                iter = iterationData.allStories[i].iteration; // reset iter number to next one
            }
            
        }
        if (iterationData.allStories[i].estimate && iterationData.allStories[i].current_state == "accepted") {
            pointsLeft -= iterationData.allStories[i].estimate;
        }
    }
    
    burndown.push(pointsLeft);
    
    release.remainingPoints = pointsLeft;

    return burndown;
}

function CompletionEstimate(iterationData, release, labels, burndownData) {

    var estimate = [];
    var averageVelocity = (iterationData.totalPoints - release.remainingPoints) / iterationData.iterations.length;
    var weeksLeft = Math.ceil(release.remainingPoints / averageVelocity);
    var pointsLeft = release.remainingPoints;
    var padding = burndownData.length;

    var date = new Date();
    date = new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay() + 1, 0, 0, 0, 0);

    for (var i = 0; i < padding - 1; i += 1) {
        estimate.push(0);
    }

    //first point
    estimate.push(pointsLeft);

    for (var i = 0; i < weeksLeft; i += 1) {
        date = date.addDays(7);
        labels.push((date.getMonth() + 1) + '/' + date.getDate());
        pointsLeft -= Math.round(averageVelocity);
        if (pointsLeft <= 0) { estimate.push(0); }
        else { estimate.push(pointsLeft); }
    }

    return estimate;
}


module.exports = function (config, dependencies, job_callback) {

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

        function CatagorizeIters(alliters, callback) {

            var iterationData = {};
            iterationData.startDate = alliters[0].start; // date of very first iter
            iterationData.endDate = alliters[alliters.length - 1].finish; // it 's actually the last iter in pivatalTracker, which could be in backlog
            iterationData.iterations = alliters; // take over all iters
            iterationData.totalPoints = 0;
            iterationData.pointsAccepted = 0;
            iterationData.releases = []; // release array, gonna save all release story
            iterationData.allStories = []; // the array that saves all stories.

            //get all stories from each iteration, and label iteration numbers to them properly
            for (var i = 0; i < alliters.length; i += 1) {
                //add dummy iteration holder for empty iterations
                var dummy = {};// a dummy story
                if (alliters[i].stories.length == 0) { // if this iter has no stories at all
                    dummy.iteration = i;
                    iterationData.allStories.push(dummy);
                };
                for (var j = 0; j < alliters[i].stories.length; j += 1) {
                    alliters[i].stories[j].iteration = i; // label each story's which iter they belong to
                    iterationData.allStories.push(alliters[i].stories[j]);
                }
            }

            //get all releases
            var n = 0;
            iterationData.allStories.forEach(function (story) {
                if (story.estimate) { iterationData.totalPoints += story.estimate; } // get total points in project from here
                if (story.story_type == "release") { // get release story in order(from earliest created to latest created)
                    story.number = n;  // record release index
                    iterationData.releases.push(story); // save each release story
                }
                n += 1;
            });

            //set the story the release starts from
            iterationData.releases[0].startPoint = 0; // initialing the start Index for first release
            iterationData.releases[0].startDate = iterationData.startDate; // first release has to start from first iteration
            for (var i = 1; i < iterationData.releases.length; i += 1) {
                if (iterationData.releases[i - 1].current_state == "accepted") {
                    iterationData.releases[i].startPoint = iterationData.releases[i - 1].number; // if previous release is done, then record start Index as the index of previous index
                    iterationData.releases[i].startDate = iterationData.releases[i - 1].accepted_at; // start date right after the end date of last one
                }
                else { // if previous is not done
                    iterationData.releases[i].startPoint = iterationData.releases[i - 1].startPoint; // start index is the start point of previous release
                    iterationData.releases[i].startDate = iterationData.releases[i - 1].startDate;
                }
            }

            //set the story the release ends on
            iterationData.releases.forEach(function (release) {
                release.endPoint = release.number;
                release.totalPoints = 0;
            });

            //set the total points for each release
            iterationData.releases.forEach(function (release) {
                for (var i = release.startPoint; i < release.number; i += 1) {
                    if (iterationData.allStories[i].estimate) { release.totalPoints += iterationData.allStories[i].estimate; }
                }
            });

            callback(null, iterationData);

        },

        //load the saved iteration stats from Disk
        function LoadIterationBurndownStatistics(iterationData, callback) {

            var burndownStats = {};

            burndownStats.iterationData = iterationData; // take over it

            callback(null, burndownStats);
          
        },

        //Process the stats
        function ProcessBurndownStatistics(burndownStats, callback) {

            allreleaseData = [];
            var numRelease = burndownStats.iterationData.releases.length;
            for (var i = 0; i < numRelease; i += 1) {
                var burndownChartData = {};
                burndownChartData.numReleases = numRelease

                burndownChartData.releaseName = (i+1).toString() + ": " + burndownStats.iterationData.releases[i].name;

                burndownChartData.labels = BuildLabels(burndownStats.iterationData, burndownStats.iterationData.releases[i]);

                if (burndownStats.iterationData.releases[i].deadline) {
                    burndownChartData.baseline = BuildBaseline(burndownStats.iterationData, burndownStats.iterationData.releases[i]);
                } else { burndownChartData.baseline = []; }

                burndownChartData.startDate = burndownStats.iterationData.startDate;

                //store the current point count
                burndownChartData.burndownData = BuildBurndownLine(burndownStats.iterationData,
                                                                burndownStats.iterationData.releases[i]);

                burndownChartData.estimation = CompletionEstimate(burndownStats.iterationData,
                                                                burndownStats.iterationData.releases[i],
                                                                burndownChartData.labels,
                                                                burndownChartData.burndownData);

                burndownChartData.labels = ReBuildLabels(burndownChartData.labels);
          

                // append dataset of each release
                allreleaseData.push(burndownChartData);
            }

            callback(null, allreleaseData);

        },

        //save the results to return more quickly next time around
        function SaveData(burndownData, callback) {

            var results = {};

            results.stats = burndownData;
            results.lastResultUpdate = new Date();

            //store the results
            storage.set('cachedResults', results, function (err, data) {

                job_callback(null, { title: config.widgetTitle, results: results.stats });
                callback();

            });
        }

    ]);

};