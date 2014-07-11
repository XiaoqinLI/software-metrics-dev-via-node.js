widget = {
    onData: function(el, data) {
		$('.content', el).empty();
		
        if (data.title) {
            $('h2', el).text(data.title);
        }
		
		var cur_vel = data.stats[0].value;
		var pre_vel = data.stats[1].value;
		var diff = Math.abs(cur_vel-pre_vel);
		var diffText = " compared to last iter";
		$('.content', el).append(
					"<div class='item-container'>" +
						"<div class='currentVelocity'>" + cur_vel.toString() + "</div>" +
					"</div>"
		 );
		
		if (cur_vel >= pre_vel) {
			$('.item-container', el).append("<div class='graph' style='color:green'>"+ diff.toString() + " " + "<img src='images/green-up.png'></div>");
		} else {
			$('.item-container', el).append("<div class='graph' style='color:red'>" + diff.toString() + " " + "<img src='images/red-down.png'></div>");
		}
		$('.item-container', el).append("<div class='text'>" + diffText + "</div>");
		 
    }

}


