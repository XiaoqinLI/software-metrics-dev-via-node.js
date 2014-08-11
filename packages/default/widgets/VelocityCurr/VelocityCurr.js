widget = {
    onData: function(el, data) {
		$('.content', el).empty();
		
        if (data.title) {
            $('h2', el).text(data.title);
        }
		
		var cur_vel = data.stats[0].value;
		var pre_vel = data.stats[1].value;
        if (pre_vel == 0){
            pre_vel = cur_vel;
            }
		var diff = Math.abs(cur_vel-pre_vel);
		var diffText = " compared to last iter";
		$('.content', el).append(
					"<div class='item-container'>" +
						"<div class='current-velocity information'>" + cur_vel.toString() + "</div>" +
					"</div>"
		 );
		
		if (cur_vel >= pre_vel) {
			$('.item-container', el).append("<div class='graph good-indicator current-velocity-diff'>"+ diff.toString() + " " + "<img src='images/green-up.png'></div>");
		} else {
			$('.item-container', el).append("<div class='graph not-good-indicator'>" + diff.toString() + " " + "<img src='images/red-down.png'></div>");
		}
		$('.item-container', el).append("<div class='current-velocity-text'>" + diffText + "</div>");
		 
    }

}


