/**
 * Job: FailedBuildJob
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

var async = require("async");
module.exports = function (config, dependencies, job_callback) {
    
    var logger = dependencies.logger;
    var storage = dependencies.storage;
    
    //build the builds URL
    
    var buildConfigList = config.buildConfiguration;
    
    var failedBuildsList = [];
    
    var root_url = config.teamcityServer + "/httpAuth/app/rest/buildTypes/id:";
    
    var options = {
        url: root_url,
        auth: 
 {
            user: config.globalAuth["teamcity"].username,
            pass: config.globalAuth["teamcity"].password,
            sendImmediately: false
        },
        
        headers: {
            "Accept": 'application/json'
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

        function GetAllBuildID(callback) {
        buildConfigList.forEach(function (buildConfig) {
            failedBuildsList.push({ "buildID": buildConfig });
        })
        callback(null, failedBuildsList)
    },


     function AddEachBuildStatus(failedBuildsList, callback) {
         async.eachSeries(failedBuildsList,
        function (BuildsMap, callback) {
            options.url = root_url + BuildsMap.buildID + "/builds";
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
                    BuildsMap.response = JSON.parse(body);
                    callback();
                }
            });
        },
        function (err) {
            callback(null, failedBuildsList)
        }
);
     },

     function AddEachBuildTime(failedBuildsList, callback) {
         async.eachSeries(failedBuildsList,
         function (BuildsMap, callback) {
             options.url = config.teamcityServer + BuildsMap.response.build[0].href;
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
                     BuildsMap.response.build[0].buildinfo = JSON.parse(body);
                     callback();
                 }
             });
         },
         function (err) {
            callback(null, failedBuildsList)
        }
);

     },

        function GetAllBuildResults(failedBuildsList, callback) {
        var resultList = [];
        failedBuildsList.forEach(function (singleBuild) {
            if (singleBuild.response.build[0].status != "SUCCESS") {
                resultList.push({ "buildTypeId": singleBuild.response.build[0].buildTypeId, "startDate": singleBuild.response.build[0].buildinfo.startDate.substring(0,8), "url": singleBuild.response.build[0].webUrl })
    }
        });

        callback(null, resultList)

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
        ]
);
    
};