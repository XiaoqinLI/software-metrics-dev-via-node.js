
module.exports = function (config, dependencies, job_callback) {
    var logger = dependencies.logger;

    //build the URL
    var url = config.pivotalTrackerServer + "/services/v5/projects/" + config.projectId + "/stories?filter=story_type:release";

    var options = {
        url: url,
        headers: {
            "X-TrackerToken": config.globalAuth["pivotalTracker"].apiToken
        }

    };

    dependencies.request(options, function (err, response, body) {
        if (err || !response || response.statusCode != 200) {
            var err_msg = err || "ERROR: Couldn't access the web page at " + options.url;
            logger.error(err_msg);
            job_callback(err_msg);
        } else {
            var result = JSON.parse(body);

            job_callback(null, { title: config.widgetTitle, stories: result });
        }
    });
};
