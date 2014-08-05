widget = {
    onData: function (el, data) {
        $('.content', el).empty();
        
        if (data.title) {
            $('h2', el).text(data.title);
        }
        
        if (data.stats.length) {
            
            data.stats.forEach(function (stat) {
               // var sDate = new Date(stat.startDate);
                $('.content', el).append(
                    "<div class='item-container'>" +
                        "<div class='buildId'>" + stat.buildTypeId + "</div>" +
                         "<div class='buildDate'>" + stat.startDate.substring(4,6) + "/" + stat.startDate.substring(6,8) + "/"  + stat.startDate.substring(0,4) + "</div>" +
                        "<div class='buildLink'>" + "<a href=" + "\"" + stat.url + "\">"+ "link"+"</a>"+ "</div>" +
                        "</div>"
);
            })
        }else {
            $('.content', el).append(
                    "<div class='item-container'>" +
                        "<div class='None'>" + "None of latest build failed" + "</div>" +
                        "</div>"
);
        }
    }
};
