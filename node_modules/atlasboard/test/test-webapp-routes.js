var assert = require ('assert');
var web_routes = require ('../lib/webapp/routes.js');
var path = require ('path');

function hasRoute(app, route){
  return app.routes.get.filter(function(item){return item.path === route;}).length;
}

describe ('routes', function(){

  it('has the necessary routes', function(done){
    var app = require('express')();
    var configPath = path.join(process.cwd(), 'test', 'fixtures', 'config','valid-config.json');
    var config = require('../lib/config-manager')(configPath);
    web_routes(app, null, null, config);
    assert.ok(hasRoute(app, "/"));
    assert.ok(hasRoute(app, "/:dashboard"));
    assert.ok(hasRoute(app, "/:dashboard/js"));
    assert.ok(hasRoute(app, "/widgets/:widget"));
    assert.ok(hasRoute(app, "/widgets/:widget/js"));
    assert.ok(hasRoute(app, "/log"));
    done();
  });

  describe ('/log route', function(){

    it('should return error if live logging is not enabled', function(done){
      var app = require('express')();
      var configPath = path.join(process.cwd(), 'test', 'fixtures', 'config','log-disabled.json');
      var config = require('../lib/config-manager')(configPath);
      web_routes(app, null, null, config);

      var logRoute = app.routes.get.filter(function(item){return item.path === '/log';})[0];
      var res = { end: function (msg){
        assert.ok(msg.indexOf('live logging it disabled')>-1);
        done();
      }};
      logRoute.callbacks[0]({}, res);
    });

    it('should render view if live logging is enabled', function(done){
      var app = require('express')();
      var configPath = path.join(process.cwd(), 'test', 'fixtures', 'config','log-enabled.json');
      var config = require('../lib/config-manager')(configPath);
      web_routes(app, null, null, config);

      var logRoute = app.routes.get.filter(function(item){return item.path === '/log';})[0];
      var viewPath = path.join(__dirname, "../", "templates", "dashboard-log.ejs");
      var res = { render: function (view){
        assert.equal(viewPath, view);
        done();
      }};
      logRoute.callbacks[0]({}, res);
    });

  });
});