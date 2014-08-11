widget = {
    onData: function (el, data) {

        if (data.title) {
            $('h2', el).text(data.title);
        }

        if (Object.keys(data.result).length != 0) {
            $('.left', el).empty();
            $('.right', el).empty();

            $('.left', el).append("<div class='coverageHeader'>Coverage</div>");
            $('.coverageHeader', el).append(
                "<div class='coveragePercent information'>" + "Statement: " + data.result.coverage.CodeCoverageS + "%</div>" +
                "<div class='coveragePercent information'>" + "Methods: " + data.result.coverage.CodeCoverageM + "%</div>" +
                "<div class='coveragePercent information'>" + "Classes: " + data.result.coverage.CodeCoverageC + "%</div>"
                );

            //Work out percentage (Current month/previous month *100) -100 to get the percent difference to previous month.
            var percentS = data.result.lastChangeS;
            var percentM = data.result.lastChangeM;
            var percentC = data.result.lastChangeC;


            var coverageClass;
            var coverageImage;

            if (percentS == 0) {
                coverageClass = "coverageNeutral";
                coverageImage = "";
            }
            else if (percentS < 0) {
                coverageClass = "coverageDown";
                coverageImage = "<img src='images/red-down.png'>";
            }
            else {
                coverageClass = "coverageUp";
                coverageImage = "<img src='images/green-up.png'>";
            }
            //Display percent difference       
            $('.right', el).append("<div class='coverageHeader'>Percent Change</div><div class='" + coverageClass + "'>" + percentS + "% " + coverageImage + "</div>");

            if (percentM == 0) {
                coverageClass = "coverageNeutral";
                coverageImage = "";
            }
            else if (percentM < 0) {
                coverageClass = "coverageDown";
                coverageImage = "<img src='images/red-down.png'>";
            }
            else {
                coverageClass = "coverageUp";
                coverageImage = "<img src='images/green-up.png'>";
            }
            //Display percent difference       
            $('.right', el).append("<div class='" + coverageClass + "'>" + percentM + "% " + coverageImage + "</div>");

            var coverageClass;
            var coverageImage;

            if (percentC == 0) {
                coverageClass = "coverageNeutral";
                coverageImage = "";
            }
            else if (percentC < 0) {
                coverageClass = "coverageDown";
                coverageImage = "<img src='images/red-down.png'>";
            }
            else {
                coverageClass = "coverageUp";
                coverageImage = "<img src='images/green-up.png'>";
            }
            //Display percent difference       
            $('.right', el).append("<div class='" + coverageClass + "'>" + percentC + "% " + coverageImage + "</div>");
           // /*
        }
        else {
            $('.content', el).empty();
            $('.content', el).append(
                "<div> No code coverage is included in this dashboard because we cannot find a TeamCity config for this project. </div>"
                );
        }
           // */
    }

}
