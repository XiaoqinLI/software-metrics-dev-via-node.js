var _ = require('underscore');

module.exports = function(config, dependencies, job_callback) {
    var quotes = config.quotes;
    quotes = _.shuffle(quotes);
    var display = [];
    for (var i = 0; i < config.limit && i < quotes.length; i++) {
        display.push(quotes[i]);
    }
    job_callback(null, {quotes: display, title: config.widgetTitle});
};