var state = "";

module.exports = function(config, dependencies, job_callback) {		
	job_callback(null, state);
	state = "ok"; //some random state
};