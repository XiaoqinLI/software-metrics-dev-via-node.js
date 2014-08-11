widget = {
    //runs when we receive data from the job
    onData: function (el, data) {

        //The parameters our job passed through are in the data object
        //el is our widget element, so our actions should all be relative to that
        function buildDataset1(dataList, i){
            var temp = {
                labels: dataList[i].labels,
                datasets: [
                    {
                        label: "Iteration Baseline",
                        fillColor: "rgba(0,0,0,0.1)",
                        strokeColor: "rgba(255,140,0,1)",
                        pointColor: "rgba(255,140,0,1)",
                        pointStrokeColor: "#fff",
                        pointHighlightFill: "#fff",
                        pointHighlightStroke: "rgba(220,220,220,1)",
                        data: dataList[i].baseline,
                        title: "Target"
                    },
                    {
                        label: "My Second dataset",
                        fillColor: "rgba(0,0,0,0.1)",
                        strokeColor: "rgba(160,32,240,1)",
                        pointColor: "rgba(160,32,240,1)",
                        pointStrokeColor: "#fff",
                        pointHighlightFill: "#fff",
                        pointHighlightStroke: "rgba(151,187,205,1)",
                        data: dataList[i].burndownData,
                        title: "Actual Progress"
                    },
                    {
                        label: "Completion Estimate",
                        fillColor: "rgba(0,0,0,0.1)",
                        strokeColor: "rgba(100,100,100,1)",
                        pointColor: "rgba(100,100,100,1)",
                        pointStrokeColor: "#fff",
                        pointHighlightFill: "#fff",
                        pointHighlightStroke: "rgba(151,187,205,1)",
                        data: dataList[i].estimation,
                        title: "Completion Estimate"
                    }
                ]
            };
            return temp
        }

        function buildDataset2(dataList, i) {
            var temp = {
                labels: dataList[i].labels,
                datasets: [
                    {
                        label: "My Second dataset",
                        fillColor: "rgba(0,0,0,0.1)",
                        strokeColor: "rgba(160,32,240,1)",
                        pointColor: "rgba(160,32,240,1)",
                        pointStrokeColor: "#fff",
                        pointHighlightFill: "#fff",
                        pointHighlightStroke: "rgba(151,187,205,1)",
                        data: dataList[i].burndownData,
                        title: "Actual Progress"
                    },
                    {
                        label: "Completion Estimate",
                        fillColor: "rgba(0,0,0,0.1)",
                        strokeColor: "rgba(100,100,100,1)",
                        pointColor: "rgba(100,100,100,1)",
                        pointStrokeColor: "#fff",
                        pointHighlightFill: "#fff",
                        pointHighlightStroke: "rgba(151,187,205,1)",
                        data: dataList[i].estimation,
                        title: "Completion Estimate"
                    }
                ]
            };
            return temp
        }

        $('.content', el).empty();

        if (data.title) {
            $('h2', el).text(data.title);
        }
        $('.content', el).append(
            "<div id='selectorDiv'>" + "Select a Release: " +
            "<select id='ReleaseID'>" +
            "</select>" +
            "</div>"
               );

        for (var i = 0; i < data.results.length; i++) {
            $('select', el).append(
                "<option value='No_" + i.toString() + "'>" + data.results[i].releaseName +
                "</option>"
                )
        }
        
        
        for (var j = 0; j < data.results.length; j++) {
            //var releaseName = data.results[j].releaseName;
            $('.content', el).append(
                "<div id='No_" + j.toString() + "'" + " class='targetDiv'" + ">" +
                 "</div>"
            );
            
            $('#' + 'No_' + j.toString(), el).append(
               "<canvas id='totalBurndownChart" + j.toString() + "'" + "width='530' height='340'>" + "</canvas>"+
               "<div id='totalBurndownLegend" + j.toString() + "'" + " class='legend'" + ">" + "</div>"
            );          
        }
        
        for (var i = 0; i < data.results.length; i++) {
            eval("var ctx" + i + "=document.getElementById('totalBurndownChart' + i.toString()).getContext('2d');");
        }        
        
        for (var i = 0; i < data.results.length; i++) {
            eval("var data" + i +";");
        }        
        
        for (var i = 0; i < data.results.length; i++) {
            if (data.results[i].baseline.length != 0) {
                eval("data" + i + "= buildDataset1(data.results," + i + ");");
            } else {
                eval("data" + i + "= buildDataset2(data.results," + i + ");");
            }
        }
        
        var datasetList = [];
        for (var i = 0; i < data.results.length; i++) {
            eval("datasetList.push(data" + i + ");")
        }
        
        for (var i = 0; i < data.results.length; i++) {
            eval("var myLineChar = new Chart(ctx" + i + ").Line(datasetList[" + i + "], {" +
                "bezierCurve: false,\
                    scaleOverride: false,\
                scaleSteps: null,        \
                scaleStepWidth: null,\
                scaleFontSize: 14,\
                pointDot: true,\
                pointDotRadius: 2,\
                pointDotStrokeWidth: 1,\
                showTooltips: false,\
                });"
            )
        }
        
        for (var i = 0; i < data.results.length; i++) {
            eval("legend(document.getElementById('totalBurndownLegend' + i.toString()), datasetList[i]);");
        }
        
        var jsCode = "$(document).ready(function() {\
                        $('#ReleaseID').change(function(){\
                            var location = $(this).val(),\
                            div = $('#' + location);\
                            $('.targetDiv').hide();\
                            div.show();\
                         });\
                      });";

        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.innerText = jsCode;
        $('.content').append(script);
    }
};