/**
 * Job: IterationStatusJob
 *
 * Expected configuration:
 * 
 * { }
 */

module.exports = function(config, dependencies, job_callback) {

    var logger = dependencies.logger;

    //build the URL
    var url = config.pivotalTrackerServer + "/services/v5/projects/" + config.projectId + "/iterations?scope=current";

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
        }
        else {
            var result = JSON.parse(body);

            var statusData = {};
            statusData.startDate = result[0].start;
            statusData.endDate = result[0].finish;

            var stories = result[0].stories;

            statusData.unestimatedItems = 0;
            statusData.pointsUnstarted = 0;
            statusData.pointsStarted = 0;
            statusData.pointsDelivered = 0;
            statusData.pointsFinished = 0;
            statusData.pointsRejected = 0;
            statusData.pointsAccepted = 0;

            stories.forEach(function (story) {

                if (story.estimate == 0) {
                    statusData.unestimatedItems++;
                }

                if (story.estimate) {

                    if (story.current_state == "unstarted") {
                        statusData.pointsUnstarted += story.estimate;
                    }

                    if (story.current_state == "started") {
                        statusData.pointsStarted += story.estimate;
                    }

                    if (story.current_state == "delivered") {
                        statusData.pointsDelivered += story.estimate;
                    }

                    if (story.current_state == "finished") {
                        statusData.pointsFinished += story.estimate;
                    }

                    if (story.current_state == "rejected") {
                        statusData.pointsRejected += story.estimate;
                    }

                    if (story.current_state == "accepted") {
                        statusData.pointsAccepted += story.estimate;
                    }
                }
            });

            var item = statusData.startDate;

            job_callback(null, { title: config.widgetTitle, status: statusData });
        }
    });

};
