var api_url = 'https://api.hipchat.com/v1',
    qstring = require('querystring');

module.exports.create = function(options) {
  var request = options.request || require ('request');

  if (!options.api_key){
    throw 'api_key required';
  }

  var errors = {
    400: 'Bad request. Please check your data',
    401: 'Unauthorized: API KEY not valid',
    403: 'You have exceeded the rate limit',
    404: 'Not found',
    406: 'You requested an invalid content type',
    500: 'Server Error',
    503: 'The method you requested is currently unavailable (due to maintenance or high load'
  };

  return {
    //----------------------------------------
    // Push message to HipChat server
    // - roomId: id of the room (number)
    // - from: sender name
    // - message: body of the message
    // - notify: should trigger a room notification? values: 1,0
    //----------------------------------------
    'message' : function (roomId, from, message, notify, callback){
      var url = api_url + '/rooms/message?format=json&auth_token=' + options.api_key;

      var cb_response = function (err, response, body){
        if (callback) {
          var err_msg = null;
          if (err || !response || response.statusCode !=200){
            err_msg = err;
            if (response && errors[response.statusCode]){
              err_msg += ' ' + errors[response.statusCode] + '; ' + body;
            }
          }
          callback (err_msg, response ? response.statusCode : null);
        }
      };

      var data = {
        room_id : roomId,
        from : from,
        message : message,
        notify : notify
      };

      request.post(
        {
          url: url,
          headers:{'content-type': 'application/x-www-form-urlencoded'},
          body: qstring.stringify(data)
        },
        cb_response
      );
    }
  };
};