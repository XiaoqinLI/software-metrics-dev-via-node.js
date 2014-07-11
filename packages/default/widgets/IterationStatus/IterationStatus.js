widget = {
    //runs when we receive data from the job
    onData: function(el, data) {

        //The parameters our job passed through are in the data object
        //el is our widget element, so our actions should all be relative to that
        if (data.title) {
            $('h2', el).text(data.title);
        }

        $('.content', el).empty();
        var oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds

        var endDate = new Date(data.status.endDate);
        var startDate = new Date();

        var diffDays = Math.round(Math.abs((endDate.getTime() - startDate.getTime()) / (oneDay)));

        var items = [];

        items.push({ key: "End Date", value: endDate.toLocaleDateString() });
        items.push({ key: "Days Until", value: diffDays });
        items.push({ key: "Unestimated Stories", value: data.status.unestimatedItems });
        items.push({ key: "Accepted Points", value: data.status.pointsAccepted });
        items.push({ key: "Rejected Points", value: data.status.pointsRejected });
        items.push({ key: "Delivered Points", value: data.status.pointsDelivered });
        items.push({ key: "Finished Points", value: data.status.pointsFinished });
        items.push({ key: "Started Points", value: data.status.pointsStarted });
        items.push({ key: "Unstarted Points", value: data.status.pointsUnstarted });

        var contentDiv = $('.content', el);

        var table = document.createElement('TABLE');
        table.width = "100%";

        var tableBody = table.createTBody();
        
        items.forEach(function (item) {

            var dataRow = tableBody.insertRow(-1);
            dataRow.insertCell(-1).innerHTML = item.key;
            dataRow.insertCell(-1).innerHTML = item.value;
        });

        $('.content', el).append(table);
    }
};