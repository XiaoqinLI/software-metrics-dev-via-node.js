widget = {
    onData: function (el, data) {
        $('.content', el).empty();
        
        if (data.title) {
            $('h2', el).text(data.title);
        }
        
        var cur_add = data.stats[0].value;
        var add_diff = data.stats[1].value;
        var cur_del = data.stats[2].value;
        var del_diff = data.stats[3].value;
        
        var diffText = " compared to last iter";
        $('.content', el).append(
					"<div class='item-container-add'>" +
                        "<div class='title'>" + data.stats[0].churnType + "</div>" +
						"<div class='current'>" + cur_add.toString() + "</div>" +
					"</div>"
);
        
        $('.content', el).append(
					"<div class='item-container-delete'>" +
                        "<div class='title'>" + data.stats[2].churnType + "</div>" +
						"<div class='current'>" + cur_del.toString() + "</div>" +
					"</div>"
);
        
        if (add_diff >= 0) {
            $('.item-container-add', el).append("<div class='graph' style='color:red'>" + add_diff.toString() + " " + "<img src='images/red-up.png'></div>");
        } else {
            $('.item-container-add', el).append("<div class='graph' style='color:green'>" + Math.abs(add_diff).toString() + " " + "<img src='images/green-down.png'></div>");
        }
        if (del_diff >= 0) {
            $('.item-container-delete', el).append("<div class='graph' style='color:red'>" + del_diff.toString() + " " + "<img src='images/red-up.png'></div>");
        } else {
            $('.item-container-delete', el).append("<div class='graph' style='color:green'>" + Math.abs(del_diff).toString() + " " + "<img src='images/green-down.png'></div>");
        }
        $('.item-container-add', el).append("<div class='text'>" + diffText + "</div>");
		 
    }
}


