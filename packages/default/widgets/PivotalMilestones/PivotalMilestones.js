widget = {
    //runs when we receive data from the job
    onData: function(el, data) {

        $('.content', el).empty();
        //The parameters our job passed through are in the data object
        //el is our widget element, so our actions should all be relative to that
        if (data.title) {
            $('h2', el).text(data.title);
        }

        var contentDiv = $('.content', el);

        var table = document.createElement('TABLE');
        table.width = "100%";

        var tableHead = table.createTHead();
        var tableHeadRow = tableHead.insertRow();
        tableHeadRow.insertCell(-1).innerHTML = "Milestone";
        tableHeadRow.insertCell(-1).innerHTML = "Due Date";
        tableHeadRow.insertCell(-1).innerHTML = "Status";

        var tableBody = table.createTBody();

        data.stories.forEach(function (story) {

            var deadline = new Date(story.deadline);
            
            var dataRow = tableBody.insertRow(-1);
            dataRow.insertCell(-1).innerHTML = story.name;
            dataRow.insertCell(-1).innerHTML = deadline.toLocaleDateString("en-US");
            dataRow.insertCell(-1).innerHTML = story.current_state;
        });

        $('.content', el).append(table);
    }
};