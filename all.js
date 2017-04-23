function drawGroups(groups) {
	for(g in groups){
		//Create empty groups
		$('#controls').append('<div class="group" data-room="' + groups[g].room + '" data-room_id="' + g + '"><div class="group-head">' + groups[g].room + '<div class="group-head-off"><i class="fa fa-power-off"></i></div></div><div class="group-items"></div></div>');

		for(i in groups[g].items){
			var item = groups[g].items[i];
			var content;
			var modifier = "";

			if(item.type=="light"){
				if(item.state == true) modifier = "light-on";
				content = '<i class=" fa fa-lightbulb-o"></i>';
			}
			else if(item.type=="temp"){
				if(item.temp < 19) modifier = "temp-cold";
				else if(item.temp < 24) modifier = "temp-normal";
				else modifier = "temp-hot";
				content = item.temp + '&#176;C';
			}

			$('.group[data-room_id="' + g + '"] .group-items').append('<div class="group-item ' + item.type + ' ' + modifier + '" data-id=' + item.id + ' title="' + item.description + '">' + content + '</div>');
		}
	}
}

function drawSwitchAllOff(){
	$('#controls').append('<div id="all-off"><i class="fa fa-power-off"></i><span> Wylacz wszystkie</span></div>');
}

$(document).ready(function(){
	$.ajax({
		url: address + '/byRoom',
		success: function(groups){
			drawGroups(groups);
			drawSwitchAllOff();
		}
	}).fail(function(){
		showError("APIconnection");
	});

	//Refresh state of lights
	setInterval(function(){
		$.ajax({
			url: address + '/byRoom',
			success: function(groups){
				for(g in groups){
					for(i in groups[g].items){
						item = groups[g].items[i];
						if(item.type=="light"){
							if(item.state) $('.group-item[data-id=' + item.id + ']').addClass('light-on');
							else $('.group-item[data-id=' + item.id + ']').removeClass('light-on');
						}
						else{
							$('.group-item[data-id=' + item.id +']').html(item.temp + '&#176;C');
						}
					}
				}
			}
		});
	}, 2000);

	//Switching lights
	$("#controls").on("click", ".light", function(){
		var id = $(this).data("id");
		var t = $(this);
		$.ajax({
			url: address + '/lights/switch/id/' + id,
			success: function(res){
				if(res.state) t.addClass("light-on");
				else t.removeClass("light-on");
			}
		});

	});

	//Switching room off
	$("#controls").on("click", ".group-head-off", function(){
		var room = $(this).parents('.group').data('room_id');
		var t = $(this);
		$.ajax({
			url: address + '/lights/switch/room/' + room,
			success: function(res){
				t.parent().siblings().find('.light').removeClass('light-on');
			}
		});
	});

	//Switching all lights off
	$("#controls").on("click", "#all-off", function(){
		$.ajax({
			url: address + '/lights/switch/off/',
			success: function(res){
				
			}
		});
	});
});

