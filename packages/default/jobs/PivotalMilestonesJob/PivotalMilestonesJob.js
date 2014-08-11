var async = require("async");

module.exports = function (config, dependencies, job_callback) {
    var logger = dependencies.logger;
    var storage = dependencies.storage;

    //build the URL
    var url = config.pivotalTrackerServer + "/services/v5/projects/" + config.projectId + "/stories?filter=story_type:release";

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
                    job_callback(null, { title: config.widgetTitle, stories: data.stats });
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
                        job_callback(null, { title: config.widgetTitle, stories: cashedData });
                    } else {
                        job_callback(err_msg);
                    }
                } else {
                    var result = JSON.parse(body);

                    result.sort(storyCompare);
                    callback(null, result);
                }
            });
        },


        function SaveData(stats, callback) {

            var results = {};

            results.stats = stats;
            results.lastResultUpdate = new Date();

            //store the results
            storage.set('cachedResults', results, function (err, data) {

                job_callback(null, { title: config.widgetTitle, stories: results.stats });
                callback();

            });
        }

    
    ]);

};

function storyCompare(a, b) {
    if (a.deadline < b.deadline)
        return -1;
    if (a.deadline > b.deadline)
        return 1;
    return 0;
};