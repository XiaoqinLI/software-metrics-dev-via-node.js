/**
 * Job: <%=name%>
 *
 * Expected configuration:
 *
 * ## PLEASE ADD AN EXAMPLE CONFIGURATION FOR YOUR JOB HERE
 * { 
 *   myconfigKey : [ 
 *     { serverUrl : 'localhost' } 
 *   ]
 * }
 */

module.exports = function(config, dependencies, job_callback) {

    // ## 1. USE OF DEPENDENCIES ##
    // You can use the following dependencies in your job:
    // - dependencies.easyRequest : a wrapper on top of the "request" module
    // - dependencies.request : the popular http request module itself
    // - dependencies.logger : atlasboard logger interface
    // - dependencies.underscore
    // - dependencies.moment
    // - dependencies.storage : a simple persistance layer for Atlasboard    

    // # 2. CONFIGURATION CHECK
    // You probably want to check that the right configuration has been passed to the job.
    // You can add unit tests to ensure this (see test/<%=name%> file)
    // Your config check may look something like this:
    // if (!config.globalAuth || !config.globalAuth[authName] ||
    //   !config.globalAuth[authName].username || !config.globalAuth[authName].password) {
    //   return job_callback('no credentials found in the <%=name%> job. Please check the global authentication file!');
    // }

    // # 3. USE OF JOB_CALLBACK
    // Using nodejs callback standard conventions, you should return an error or null (if success) 
    // as the first parameter, and the actual data to be sent to the widget as the second parameter. 
    // Atlasboard will deal with the rest.

    // This is an example of how to make an HTTP call to google using the easyRequest dependency, 
    // and send the result to the registered atlasboard widgets.
    // Have a look at test/<%=name%> for an example of how to unit tests this easily by mocking easyRequest calls
    dependencies.easyRequest.HTML('http://google.com', function(err, html){
      job_callback(err, { title: config.widgetTitle, html: html });
    });
};
