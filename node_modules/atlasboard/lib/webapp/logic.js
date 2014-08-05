var helpers = require('../helpers'),
    fs = require('fs'),
    path = require('path'),
    itemManager = require('../item-manager'),
    logger = require('../logger')();


function getSafeItemName (item_name){
  return path.basename(item_name).split('.')[0];
}

function addNamespace (css, res, widgetNamespace){
  function namespaceRulesAST (rules) {
    rules.forEach(function (rule) {
      if (rule.selectors) {
        rule.selectors = rule.selectors.map(function (selector) {
          if (selector === '@font-face') {
            return selector;
          }
          return 'li[data-widget-id="' + widgetNamespace + '"] ' + selector;
        });
      }
      // Handle rules within media queries
      if (rule.rules) {
        namespaceRulesAST(rule.rules);
      }
    });
  }

  if (css){
    var cssModule = require('css');
    var cssAST = cssModule.parse(css.toString());
    namespaceRulesAST(cssAST.stylesheet.rules);
    res.write(cssModule.stringify(cssAST));
  }
}

module.exports = {

    // ---------------------------------------------------------------
    // Render dashboard list
    // ---------------------------------------------------------------
    listAllDashboards : function (packagesPath, req, res){
      itemManager.get(packagesPath, "dashboards", ".json", function(err, dashboard_config_files){
        if (err){
          logger.error(err);
          return res.send(400, "Error loading dashboards");
        }
        if (dashboard_config_files.length===1){
          return res.redirect("/" + getSafeItemName(dashboard_config_files[0]));
        }
        else{
          var availableDashboards = dashboard_config_files.map(function(file){return path.basename(file, ".json");});
          res.render(path.join(__dirname, "../..", "templates", "dashboard-list.ejs"), { dashboards: availableDashboards.sort()});
        }
      });
    },

    // ---------------------------------------------------------------
    // Render a specific dashboard
    // ---------------------------------------------------------------
    renderDashboard : function (packagesPath, dashboardName, req, res){
      dashboardName = getSafeItemName(dashboardName);
      itemManager.get_first(packagesPath, dashboardName, "dashboards", ".json", function(err, dashboard){
        if (err || !dashboard){
          return res.send(err ? 400 : 404, err ? err : "Trying to render dashboard " + dashboardName + ", but couldn't find any dashboard in the packages folder");
        }
        var jsonBody;
        try {
          jsonBody = JSON.parse(fs.readFileSync(dashboard));
        }
        catch(e){
          return res.send(400, "Invalid dashboard config file");
        }
        res.render(path.join(__dirname, "../..", "templates", "dashboard.ejs"), {
          dashboardName: dashboardName,
          dashboardConfig: jsonBody
        });
      });
    },

    // ---------------------------------------------------------------
    // Render custom JS for a dashboard
    // ---------------------------------------------------------------
    renderJsDashboard : function (packagesPath, wallboard_assets_folder, dashboardName, req, res){
      dashboardName = getSafeItemName(dashboardName);
      itemManager.get_first(packagesPath, dashboardName, "dashboards", ".json", function(err, dashboardPath){
        if (err || !dashboardPath){
          return res.send(err ? 400 : 404, err ? err : "Trying to render dashboard " + dashboardName + ", but couldn't find any dashboard in the packages folder");
        }

        var dashboard;
        try{
          dashboard = JSON.parse(fs.readFileSync(dashboardPath));
        }
        catch (e){
          return res.send(400, "Error reading dashboard");
        }

        if (!dashboard.layout.customJS){
          return res.send(200, "");
        }

        res.type("application/javascript");

        var assets = dashboard.layout.customJS.map(function(file){
          return path.join(wallboard_assets_folder, '/javascripts/' + file);
        });
        assets.forEach(function(file){
          if (fs.existsSync(file)){
            res.write(fs.readFileSync(file) + "\n\n");
          }
          else{
            logger.error(file + " not found");
          }
        });

        //TODO: minify, cache, gzip
        res.end();

      });
    },

    // ---------------------------------------------------------------
    // Render specific resource for a widget
    // - resource format: <package>/<widget>/<resource>
    //   ex: atlassian/blockers/icon.png
    // ---------------------------------------------------------------
    renderWidgetResource: function (localPackagesPath, resource, req, res){
      if (!resource){
        return res.send(400, 'resource id not specified');
      }
      //sanitization
      var input = resource.split('/');
      if (input.length !== 3) {
        return res.send(400, 'bad input');
      }
      var packageName = input[0];
      var widgetName = input[1];
      var resourceName = input[2];

      //TODO: add extra sanitization
      var resourcePath = path.join(localPackagesPath, packageName, 'widgets', widgetName, resourceName);
      if (fs.existsSync(resourcePath)){
        res.sendfile(resourcePath);
      }
      else {
        return res.send(404, 'resource not found');
      }
    },

    // ---------------------------------------------------------------
    // Render JS for a specific widget
    // ---------------------------------------------------------------
    renderJsWidget: function (packagesPath, widgetName, req, res){
      res.type("application/javascript");
      widgetName = getSafeItemName(widgetName);
      itemManager.get_first(packagesPath, widgetName, "widgets", ".js", function(err, html_file){
        if (err || !html_file){
          return res.send(400, "Error rendering widget");
        }
        res.sendfile(html_file);
      });
    },

    // ---------------------------------------------------------------
    // Render HTML
    // ---------------------------------------------------------------
    renderHtmlWidget : function (packagesPath, widgetName, req, res){
      res.type("text/html");

      widgetName = getSafeItemName(widgetName);

      itemManager.get_first(packagesPath, widgetName, "widgets", ".css", function(err, css_file){
        if (!err && css_file){ //this is optional
          res.write("<style>");
          addNamespace(fs.readFileSync(css_file), res, widgetName);
          res.write("</style>");
        }

        itemManager.get_first(packagesPath, widgetName, "widgets", ".html", function(err, html_file){
          if (err || !html_file){
            return res.send(404, "Error rendering widget");
          }

          res.write(fs.readFileSync(html_file));

          res.end();
        });
      });
    },

    log : function (req, res){
      res.render(path.join(__dirname, "../..", "templates", "dashboard-log.ejs"));
    },

    // For testing only
    _addNamespace: addNamespace
};
