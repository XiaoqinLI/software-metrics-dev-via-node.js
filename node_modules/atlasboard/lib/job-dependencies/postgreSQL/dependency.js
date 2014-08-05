var pg = require('pg');

var query = function(connectionString, query, params, callback) {
  // handle case where params are omitted
  if (arguments.length === 3) {
    callback = params;
    params = [];
  }

  pg.connect(connectionString, function(err, client, done) {
    if (err) {
      console.error('Error connecting to postgreSQL:' + err);
      done();
      return callback (err);
    }
    client.query(query, params, function(err, results) {
      if (err) {
        console.error('Error executing postgreSQL query:' + err);
        done();
        return callback (err);
      }
      done();
      callback(null, results);
    });
  });
};

module.exports = function (jobWorker, io, globalConfig){
  return {
    pg: pg, //expose postgreSQL module
    query: query //expose query helper
  };
};

