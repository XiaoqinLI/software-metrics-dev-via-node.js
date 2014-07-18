/**
 * Job: CodeStatsJob
 *
 * Expected configuration:
 * 
 * { }
 */
module.exports = function (config, dependencies, job_callback) {
var async = require("async");
    var logger = dependencies.logger;
    var storage = dependencies.storage;
    var url =  config.gitHubServer + "/" + config.gitHubAccountId + "/" + config.repoId + "/commits?per_page=100&page=1"
    
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
        function GetAllCommitsMap(callback) {
            dependencies.request(options, function (err, response, body) {
                if (err || !response || response.statusCode != 200) {
                    var err_msg = err || "ERROR: Couldn't access the web page at " + options.url;
                    logger.error(err_msg);
                    job_callback(err_msg);
                } else {

                    var commitsMap = JSON.parse(body);
                    
                    callback(null, commitsMap)

                }
            });
        },

        function AddIndivisualCommits(commitsMap, callback) {
            async.each(commitsMap,
        function (individualCommit, callback) {
                options.url = config.gitHubServer + "/" + config.gitHubAccountId + "/" + config.repoId + "/commits/" + individualCommit.sha
                dependencies.request(options, function (err, response, body) {
                    if (err || !response || response.statusCode != 200) {
                        var err_msg = err || "ERROR: Couldn't access the web page at " + options.url;
                        logger.error(err_msg);
                        job_callback(err_msg);
                    } else {
                        individualCommit.response = JSON.parse(body);
                        callback();
                    }
                });
            },
        function (err) {
                callback(null, commitsMap)
            }
);

        },

        function filesChangeStats(commitsMap, callback) {
            var totalLineAdded = 0;
            var totalLineRemoved = 0;      
            var changeRatio = 0;
            var trackingFileList = ["cs","java","cshtml","scala","mustache","js","css","scss","sql","config","ois_export"];
            commitsMap.forEach(function (singleCommit) {

                singleCommit.response.files.forEach(function (singleFile){
                    var filename = singleFile.filename;
                    var endname = filename.split(".")
                    var index = false;
                    for (i = 0; i < trackingFileList.length; i++) {
                        if (trackingFileList[i] == endname[endname.length - 1]) {
                            index = true;
                        }
                    }
                    if (index) {
                        totalLineAdded += singleFile.additions;
                        totalLineRemoved += singleFile.deletions;
                    }
                    
                });
            }); // end of commitesMap forEach loop
            if (totalLineAdded > 0) {
                changeRatio = ((totalLineRemoved / (totalLineAdded))*100).toFixed(4);
            }

            stats = [{ "statsType" : "LinesAdded", "value" : totalLineAdded.toString() },
        { "statsType" : "LinesRemoved", "value" : totalLineRemoved.toString()},
        { "statsType" : "Modified Ratio", "value" : changeRatio.toString().concat('%')}];
            callback(null, stats)
        }

        ],

        function (err, stats) {
            job_callback(null, { title: config.widgetTitle, stats: stats });
        }
);
    }, 1000);

};