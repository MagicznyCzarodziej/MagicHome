function drawRooms(rooms){
	for(r in rooms){
		$('#controls').append('<div class="room" data-name="' + rooms[r] + '"><div class="room-label">' + rooms[r] + '</div></div>');
	}

	//Draw ALL OFF button
	$('#controls').append('<div class="room"><div class="room-label">&nbsp;</div><div class="element"><div class="element-label">Wszystkie OFF</div><div class="element-button all-off"><i class="fa fa-ban"></i></div></div></div>');
}

function drawLights(lights){
	for(i in lights){
		$('.room[data-name=' + lights[i].room + ']').append('<div class="element"><div class="element-label">' + lights[i].name + '</div><div class="element-button" id="led_' + lights[i].id + '" data-id=' + lights[i].id + '><i class=" fa fa-lightbulb-o"></i></div></div>');
		
		if(lights[i].state) $('#led_' + lights[i].id).addClass('light-on');
	}
}

function drawThermometers(thermometers){
	for(i in thermometers){
		$('.room[data-name=' + thermometers[i].room + ']').append('<div class="element"><div class="element-label">' + thermometers[i].name + '</div><div class="element-info" id="temp_' + thermometers[i].id + '" data-id=' + thermometers[i].id + ' data-name="' + thermometers[i].name +'">' + thermometers[i].temp + ' &#176;C</div></div>');
		
		if(thermometers[i].temp < 19) $('#temp_' + thermometers[i].id).addClass("temp-cold");
		else if(thermometers[i].temp < 24) $('#temp_' + thermometers[i].id).addClass("temp-normal");
		else $('#temp_' + thermometers[i].id).addClass("temp-hot");
	}
}

$(document).ready(function(){
	$.ajax({
		url: 'http://192.168.100.28:3000/rooms',
		success: function(rooms){
			drawRooms(rooms);
		}
	}).fail(function(){
		showError("APIconnection");
	});

	$.ajax({
		url: 'http://192.168.100.28:3000/all',
		success: function(elements){
			var lights = elements["lights"];
			drawLights(lights);

			var thermometers = elements["thermometers"];
			drawThermometers(thermometers);
		}
	}).fail(function(){
		showError("APIconnection");
	});

	//Refresh state of lights
	setInterval(function(){
		$.ajax({
			url: 'http://192.168.100.28:3000/lights',
			success: function(lights){
				for(i in lights){
					if(lights[i].state) $('#led_' + lights[i].id).addClass("light-on");
					else $('#led_' + lights[i].id).removeClass("light-on");
				}
			}
		});
	}, 2000);

	//Switching lights
	$("#controls").on("click", ".element-button:not(.all-off)", function(){
		console.log("---------------------");

		var id = $(this).data("id");
		var name = $(this).data("name");
		$.ajax({
			url: 'http://192.168.100.28:3000/lights/switch/id/' + id,
			success: function(res){
				console.log("PIN " + id + ": " + (res.state?"ON":"OFF"));

				if(res.state) $("#led_" + id).addClass("light-on");
				else $("#led_" + id).removeClass("light-on");
			}
		});

		console.log("SENT switch PIN " + id + " (" + name + ")");
	});

	//Switch all lights off
	$("#controls").on("click", ".all-off", function(){
		$.ajax({
			url: 'http://192.168.100.28:3000/lights/switch/off',
			success: function(res){
				console.log("All lights OFF");
				if(res.success)$(".element-button:not(.all-off)").removeClass("light-on");
			}
		});
	});
});