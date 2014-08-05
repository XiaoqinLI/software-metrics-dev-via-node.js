/**
 * Job: WeeklyCodeChurnJob
 *
 * Expected configuration:
 * 
 * { }
 */
var async = require("async");
module.exports = function (config, dependencies, job_callback) {

    var logger = dependencies.logger;
    var storage = dependencies.storage;
    var repoConfigList = config.repoId;
    var codeChurnList = [];
    var root_url = config.gitHubServer + "/" + config.gitHubAccountId + "/";//+ config.repoId + "/stats/code_frequency"
    
    var options = {
        pageNumber: 1,
        url: root_url,
        auth:
            {
                user: config.globalAuth["github"].username,
                pass: config.globalAuth["github"].password,
                sendImmediately: true
            },
        headers: {
            "Accept": 'application/json',
            "User-Agent": 'DLPStatusBoard',
            "curl": '-i'
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
                    job_callback(null, { title: config.widgetTitle, statsList: data.stats });
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

        function GetAllRepoID(callback){
            repoConfigList.forEach(function(repoConfig){
                codeChurnList.push({ "repoID": repoConfig });
            })
            callback(null, codeChurnList)
        },

        function GetAllWeeklyCodeChurn(codeChurnList, callback) {
            async.eachSeries(codeChurnList,
            function (codeChurnMap, callback) {
                options.url = root_url + codeChurnMap.repoID + "/stats/code_frequency";
                dependencies.request(options, function (err, response, body) {
                    if (err || !response || response.statusCode != 200) {
                        var err_msg = err || "ERROR: Couldn't access the web page at " + options.url;
                        logger.error(err_msg);
                        if (cashedFlag) {
                            job_callback(null, { title: config.widgetTitle, statsList: cashedData });
                        } else {
                            job_callback(err_msg);
                        }
                    } else {
                        codeChurnMap.response = JSON.parse(body);
                        callback();
                    }
                });
            },
               function (err) {
                   callback(null, codeChurnList)
               }
       );

            },

        function filesChangeStats(codeChurnArray, callback) {
            var statsList = []
            for (i = 0; i < codeChurnArray.length; i++) { 
                var stats = {};
                stats.repoID = codeChurnArray[i].repoID
                var prevLineAdded = codeChurnArray[i].response[codeChurnArray[i].response.length - 2][1];
                var prevlLineRemoved = Math.abs(codeChurnArray[i].response[codeChurnArray[i].response.length - 2][2]);
                var currLineAdded = codeChurnArray[i].response[codeChurnArray[i].response.length - 1][1];
                var currLineRemoved = Math.abs(codeChurnArray[i].response[codeChurnArray[i].response.length - 1][2]);
                stats.CurrLinesAdded = currLineAdded;
                stats.CurrLinesDeleted = currLineRemoved;
                stats.AddedDiff = currLineAdded - prevLineAdded;
                stats.DeletededDiff = currLineRemoved - prevlLineRemoved;
                statsList.push(stats)
                }
             
            callback(null, statsList)
        },

        //save the results to return more quickly next time around
        function SaveData(statsList, callback) {

            var results = {};

            results.stats = statsList;
            results.lastResultUpdate = new Date();

            //store the results
            storage.set('cachedResults', results, function (err, data) {

                job_callback(null, { title: config.widgetTitle, statsList: results.stats });
                callback();

            });
        }

    ]);

};