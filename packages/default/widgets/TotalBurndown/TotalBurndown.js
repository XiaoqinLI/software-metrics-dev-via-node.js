widget = {
    //runs when we receive data from the job
    onData: function (el, data) {

        //The parameters our job passed through are in the data object
        //el is our widget element, so our actions should all be relative to that
        if (data.title) {
            $('h2', el).text(data.title);
        }

        var ctx = document.getElementById("totalBurndownChart").getContext("2d");

        var data = {
            labels: data.result.labels,
            datasets: [
                {
                    label: "Iteration Baseline",
                    fillColor: "rgba(0,0,0,0.1)",
                    strokeColor: "rgba(255,140,0,1)",
                    pointColor: "rgba(255,140,0,1)",
                    pointStrokeColor: "#fff",
                    pointHighlightFill: "#fff",
                    pointHighlightStroke: "rgba(220,220,220,1)",
                    data: data.result.baseline,
                    title: "Total Baseline"
                },
                {
                    label: "My Second dataset",
                    fillColor: "rgba(0,0,0,0.1)",
                    strokeColor: "rgba(160,32,240,1)",
                    pointColor: "rgba(160,32,240,1)",
                    pointStrokeColor: "#fff",
                    pointHighlightFill: "#fff",
                    pointHighlightStroke: "rgba(151,187,205,1)",
                    data: data.result.burndownData,
                    title: "Current Progress"
                }
            ]
        };

        var myLineChart = new Chart(ctx).Line(data, {
            bezierCurve: false
        });

        legend(document.getElementById("totalBurndownLegend"), data);

    }
};