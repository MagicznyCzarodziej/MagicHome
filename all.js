function showError(type){
	switch(type){
		case "APIconnection":
			$('#controls').html('<div class="error err-connection" onClick="window.location.reload()">Błąd połączenia z serwerem API</div>');
			break;
	}
}

function showElements(rooms, elements){
	for(r in rooms){
		$('#controls').append('<div class="room room_' + rooms[r] + '" data-name="' + rooms[r] + '"><div class="room-label">' + rooms[r] + '</div>');

		for(type in elements){
			for(i in elements[type]){
				if(elements[type][i].room == rooms[r]){
					switch(type){
						case "lights":
						$('.room_' + rooms[r]).append('<div class="element"><div class="element-label">' + elements[type][i].name + '</div><div class="element-button" id="led_' + elements[type][i].id + '" data-id=' + elements[type][i].id + ' data-name="' + elements[type][i].name +'"><i class=" fa fa-lightbulb-o"></i></div></div>');
						//Set colors based on states
						if(elements[type][i].state) $('#led_' + elements[type][i].id).addClass("light-on");
					break;
					case "thermometers":
						$('.room_' + rooms[r]).append('<div class="element"><div class="element-label">' + elements[type][i].name + '</div><div class="element-info" id="temp_' + elements[type][i].id + '" data-id=' + elements[type][i].id + ' data-name="' + elements[type][i].name +'">' + elements[type][i].temp + ' &#176;C</div></div>');
							if(elements[type][i].temp < 19) $('#temp_' + elements[type][i].id).addClass("temp-cold");
							else if(elements[type][i].temp < 24) $('#temp_' + elements[type][i].id).addClass("temp-normal");
							else $('#temp_' + elements[type][i].id).addClass("temp-hot");
					break;
					}

				}

			}
		}

		$('#controls').append('</div>');
	}

	$('#controls').append('<div class="room"><div class="room-label">&nbsp;</div><div class="element"><div class="element-label">Wszystkie OFF</div><div class="element-button all-off"><i class="fa fa-ban"></i></div></div></div>');
}

function getElements(rooms){
	$.get('http://192.168.100.28:3000/all', function(elements){
		console.log("GOT state of all");

		showElements(rooms, elements);
	});
}

$(document).ready(function() {

	//Get rooms
	var rooms = "";
	
	$.ajax({
		url: 'http://192.168.100.28:3000/rooms',
		success: function(data){
			rooms = data;
		},
		async: false
	}).fail(function(){
		showError("APIconnection");
	});

	var elements = "";
	$.ajax({
		url: 'http://192.168.100.28:3000/all',
		success: function(elements){
			showElements(rooms, elements);
		},
		async: false
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
	$("#controls").on("click", ".element-button:not(.all-off)", function() {
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
	$("#controls").on("click", ".all-off", function() {
		$.ajax({
			url: 'http://192.168.100.28:3000/lights/switch/off',
			success: function(res){
				console.log("All lights OFF");
				if(res.success)$(".element-button:not(.all-off)").removeClass("light-on");
			}
		});
	});


});