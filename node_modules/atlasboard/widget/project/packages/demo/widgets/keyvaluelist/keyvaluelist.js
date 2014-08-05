widget = {
    onData: function(el, data) {
        $('.content', el).empty();

        if (data.title) {
            $('h2', el).text(data.title);
        }
        
        if (data.issues.length) {

            data.issues.forEach(function(issue) {

                $('.content', el).append(
                    "<div class='item-container'>" +
                        "<div class='issue'>" + issue.issueType + "</div>" +
                        "<div class='count'>" + issue.frequency + "</div>" +
                        "</div>"
                );
            })
        }

    }
};