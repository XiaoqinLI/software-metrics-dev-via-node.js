module.exports = function(config, dependencies, job_callback) {
    //To generate a line graph, simply create an array of numbers and send it through to the linegraph widget
    var salesData = getSalesData(15);
    job_callback(null, {linegraph: salesData, title: config.widgetTitle, dataDisplay: "soldThisMonth"});
};

function getSalesData(days) {
    //Generates some random numbers
    var results = [];

    for (var i = 0; i < days; i++) {
        results[i] = 100 + (-30 + Math.floor(Math.random() * 60));
    }

    return results;
}