widget = {
    onData: function (el, data) {

        if (data.title) {
            $('h2', el).text(data.title);
        }

        $('.left', el).empty();
        $('.left', el).append("<div class='coverageHeader'>Statement Coverage</div><div class='coveragePercent'>" + data.result.coverage + "%</div>");

        //Work out percentage (Current month/previous month *100) -100 to get the percent difference to previous month.
        var percent = data.result.lastChange;

        var coverageClass;
        var coverageImage;

        if (percent == 0) {
            coverageClass = "coverageNeutral";
            coverageImage = "";
        }
        else if (percent < 0) {
            coverageClass = "coverageDown";
            coverageImage = "<img src='images/red-down.png'>";
        }
        else {
            coverageClass = "coverageUp";
            coverageImage = "<img src='images/green-up.png'>";
        }

        //Display percent difference
        $('.right', el).empty();
        $('.right', el).append("<div class='coverageHeader'>Percent Change</div><div class='" + coverageClass + "'>" + percent + "% " + coverageImage + "</div>");
    }

}
