widget = {
    onData: function (el, data) {
        $('.content', el).empty();
        
        if (data.title) {
            $('h2', el).text(data.title);
        }
        
        if (data.stats.length) {
            
            data.stats.forEach(function (stat) {
                
                $('.content', el).append(
                    "<div class='item-container'>" +
                        "<div class='stat'>" + stat.statsType + "</div>" +
                        "<div class='counter'>" + stat.value.point + "/" + stat.value.story + "</div>" +
                        "</div>"
);
            })
        }else {      
            $('.content', el).append(
                    "<div class='item-container'>" +
                        "<div class='stat'>" + "No Data Available" +
                        "</div>"
);
        }
    }
};
