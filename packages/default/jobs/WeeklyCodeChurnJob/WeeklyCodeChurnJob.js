/**
 * Job: WeeklyCodeChurnJob
 *
 * Expected configuration:
 * 
 * { }
 */
module.exports = function (config, dependencies, job_callback) {
    var async = require("async");
    var logger = dependencies.logger;
    var storage = dependencies.storage;
    var url = config.gitHubServer + "/" + config.gitHubAccountId + "/" + config.repoId + "/stats/code_frequency"
    
    var options = {
        pageNumber: 1,
        url: url,
        auth: 
 {
            user: config.globalAuth["github"].username,
            pass: config.globalAuth["github"].password,
            sendImmediately: true
        },
        
        headers: {
            "Accept": 'application/json',
            "User-Agent": 'XiaoqinLI',
            "Authorization": '3d1d4c4953b7110fe5d8cbec2fb2753ef0874308',
            "curl": '-i'
        }
    };
    
    setTimeout(function () {
        async.waterfall([
        function GetAllWeeklyCodeChurn(callback) {
            dependencies.request(options, function (err, response, body) {
                if (err || !response || response.statusCode != 200) {
                    var err_msg = err || "ERROR: Couldn't access the web page at " + options.url;
                    logger.error(err_msg);
                    job_callback(err_msg);
                } else {
                    
                    var codeChurnArray = JSON.parse(body);
                    
                    callback(null, codeChurnArray)

                }
            });
        },

        function filesChangeStats(codeChurnArray, callback) {
            var prevLineAdded = codeChurnArray[codeChurnArray.length-2][1];
            var prevlLineRemoved = Math.abs(codeChurnArray[codeChurnArray.length - 2][2]);
            var currLineAdded = codeChurnArray[codeChurnArray.length - 1][1];
            var currLineRemoved = Math.abs(codeChurnArray[codeChurnArray.length - 1][2]);
            var addedDiff = currLineAdded - prevLineAdded;
            var deletededDiff = currLineRemoved - prevlLineRemoved;
            
            
            
            stats = [{ "churnType" : "CurrLinesAdded", "value" : currLineAdded},
        { "churnType" : "AddedDiff", "value" : addedDiff },
        { "churnType" : "CurrLinesDeleted", "value" : currLineRemoved},
        { "churnType" : "DeletededDiff", "value" : deletededDiff}];
            callback(null, stats)
        }

        ],

        function (err, stats) {
            job_callback(null, { title: config.widgetTitle, stats: stats });
        }
);
    }, 500);

};