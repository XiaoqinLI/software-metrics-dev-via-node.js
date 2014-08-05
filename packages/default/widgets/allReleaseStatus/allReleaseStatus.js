widget = {
    //runs when we receive data from the job
    onData: function (el, data) {

        $('.content', el).empty();
        //The parameters our job passed through are in the data object
        //el is our widget element, so our actions should all be relative to that
        if (data.title) {
            $('h2', el).text(data.title);
        }
        
        var remainingPoint = 0;
        var dataset = data.stats.statusData;
        
        for(var label in dataset){
            remainingPoint += dataset[label][2];
        }
        
        
        var currDate = new Date();
        var daysNeeded = Math.ceil(remainingPoint / data.stats.currVelocity) * 7;
        currDate.setDate(currDate.getDate() + daysNeeded);
        $('.content', el).append(
                    "<div class='item-container'>" +
                        "<div class='stat'>" + "Remaining Points(some were multi labeled)" + "</div>" +
                        "<div class='counter'>" + remainingPoint + "</div>" +
                    "</div>" + 
                     "<div class='item-container'>" +
                        "<div class='stat'>" + "Estimated Completion Date" + "</div>" +
                        "<div class='counter'>" + currDate.toLocaleDateString() + "</div>" +
                     "</div>"
);/*
        */
        
        var table = document.createElement('TABLE');
        table.width = "100%";

        var tableHead = table.createTHead();
        var tableHeadRow = tableHead.insertRow();
        tableHeadRow.insertCell(-1).innerHTML = "Feature Labels";
        tableHeadRow.insertCell(-1).innerHTML = "Total Points";
        tableHeadRow.insertCell(-1).innerHTML = "Completed Points";
        tableHeadRow.insertCell(-1).innerHTML = "Remaining Points";
       // data.status.forEach(function(entry){
      //      tableHeadRow.insertCell(-1).innerHTML = entry;
      //  });
        

        var tableBody = table.createTBody();
        
        
       //data.status.forEach(function (entry) {
        for(var label in dataset){

            var dataRow = tableBody.insertRow(-1);
            dataRow.insertCell(-1).innerHTML = label;
            dataRow.insertCell(-1).innerHTML = dataset[label][0];
            dataRow.cells[1].style.color = "#3F80C2";
            dataRow.insertCell(-1).innerHTML = dataset[label][1];
            dataRow.cells[2].style.color = "#009900";
            dataRow.insertCell(-1).innerHTML = dataset[label][2];
            dataRow.cells[3].style.color = "red";
        }
        $('.content', el).append(table);
    }
};