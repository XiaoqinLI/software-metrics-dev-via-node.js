widget = {
    //runs when we receive data from the job
    onData: function(el, data) {

        //$('.content', el).empty();
        //The parameters our job passed through are in the data object
        //el is our widget element, so our actions should all be relative to that
        if (data.title) {
            $('h2', el).text(data.title);
        }

       // var contentDiv = $('.content', el);

        var table = document.createElement('TABLE');
        table.width = "100%";

        var tableHead = table.createTHead();
        var tableHeadRow = tableHead.insertRow();
        tableHeadRow.insertCell(-1).innerHTML = "Milestone Name";
        tableHeadRow.insertCell(-1).innerHTML = "Due Date";

        var tableBody = table.createTBody();
        var currentDate = new Date();
        data.stories.forEach(function (story) {

            var deadline = new Date(story.deadline);
            
            var dataRow = tableBody.insertRow(-1);
            dataRow.insertCell(-1).innerHTML = story.name;
            if (story.deadline) {
                dataRow.insertCell(-1).innerHTML = deadline.toLocaleDateString("en-US");
            } else { dataRow.insertCell(-1).innerHTML = "No Due Date"}
            if (story.current_state == "accepted" && currentDate < deadline) {
                dataRow.cells[0].style.color = "#367229";
            }
            else if (story.current_state == "accepted" && currentDate > deadline) {
                dataRow.cells[0].style.color = "#367229";
            }
            else if (story.current_state != "accepted" && currentDate < deadline) {
                dataRow.cells[0].style.color = "black";
            }
            else if (story.current_state != "accepted" && currentDate > deadline) {
                dataRow.cells[0].style.color = "#893333";
            }
        });

        $('.content', el).append(table);
    }
};