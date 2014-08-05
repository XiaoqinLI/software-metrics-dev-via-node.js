var _ = require("underscore");

module.exports = function(io) {
  var eventQueue = {
    // Save the last of every event so we can send them to new clients
    latestEvents: {},

    initialize: function(io) {
      var that = this;

      io.of("/widgets").on("connection", function(socket) {
        socket.on("resend", function (data) {
          if (that.latestEvents[data]) {
            socket.emit(data, that.latestEvents[data]);
          }
        });
      });

      // broadcast every log received
      io.of("/log").on("connection", function(socket) {
        socket.on("log", function (data) {
          socket.broadcast.emit('client', data);
        });
      });

    },

    send: function(id, data) {
      this.latestEvents[id] = data;
      io.of("/widgets").emit(id, data); // emit to widget
      io.of("/log").emit('client', {widgetId : id, data: data}); // emit to logger
    }
  };
  eventQueue.initialize(io);
  return eventQueue;
};