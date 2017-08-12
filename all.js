function drawRooms(rooms) {
	for(i in rooms){
		$('#controls').append('<div class="group" data-room="' + rooms[i].name + '" data-room_id="' + rooms[i].id + '"><div class="group-head">' + rooms[i].name + '<div class="group-head-off"><i class="fa fa-power-off"></i></div></div><div class="group-items"></div></div>');
	}
}

function drawLights(lights) {
	for(i in lights){
		let thisLight = lights[i];
		let roomID = thisLight.room_id,
				id = thisLight.id,
				description = thisLight.description,
				state = thisLight.state;

		let room = $('.group[data-room_id="' + roomID + '"] .group-items');
		let item = $('<div class="group-item">');
		let button = '<i class=" fa fa-lightbulb-o"></i>';
		item.attr({"title": description, "data-id": id, "data-state": (state?"on":"off")})
				.addClass("light")
				.html(button);
		room.append(item);
	}
}

function getTemp(id, callback) {
	$.ajax({
		url: address + "/temps/" + id,
		success: function (data) {
			callback(data);
		}
	});
}

function drawTemps(temps) {
	for(i in temps){
		let thisTemp = temps[i];
		let roomID = thisTemp.room_id,
				id = thisTemp.id,
				description = thisTemp.description,
				temp,
				tempType;

		getTemp(id, function (data) {
			temp = data[1];

			if(temp < 19) tempType = "cold";
			else if(temp < 24) tempType = "normal";
			else tempType = "hot";

			let room = $('.group[data-room_id="' + roomID + '"] .group-items');
			let item = $('<div class="group-item">');
			item.attr({"title": description, "data-id": id, "data-temp": tempType})
					.addClass("temp")
					.html("<a href='./temp.html?" + id + "'>" + temp + "&#176;C</a>");
			room.append(item);
		});
	}
}

/*
function drawGroups(groups){
	for(g in groups){
		//Create empty groups
		$('#controls').append('<div class="group" data-room="' + groups[g].room + '" data-room_id="' + g + '"><div class="group-head">' + groups[g].room + '<div class="group-head-off"><i class="fa fa-power-off"></i></div></div><div class="group-items"></div></div>');

		for(i in groups[g].items){
			var item = groups[g].items[i];

			var thisRoom = $('.group[data-room_id="' + g + '"] .group-items');
			var thisItem = $('<div class="group-item">');
			thisItem.attr({"title": item.description, "data-id": item.id});

			switch(item.type){
				case "light":
					var button = '<i class=" fa fa-lightbulb-o"></i>';
					thisItem
						.addClass("light")
						.attr("data-state", item.state?"on":"off")
						.html(button);
					break;
				case "temp":
					var temp;
					if(item.temp < 19) temp = "cold";
					else if(item.temp < 24) temp = "normal";
					else temp = "hot";
					thisItem
						.addClass("temp")
						.attr("data-temp", temp)
						.html("<a href='./temp.html?" + item.id + "'>" + item.temp + "&#176;C</a>");
					break;
				default:
					console.error("Nieprawidłowy typ obiektu (item.type): " + item.type);
					break;
			}
			thisRoom.append(thisItem);
		}
	}
}
*/
function drawSwitchAllOff(){
	$('#controls').append('<div id="all-off"><i class="fa fa-power-off"></i><br><span style="font-family: Orbitron;"> Wylacz wszystkie swiatla</span></div>');
}

function drawRefreshed(groups){
	for(g in groups){
		for(i in groups[g].items){
			item = groups[g].items[i];
			var thisItem = $('.group-item[data-id=' + item.id + ']');

			switch(item.type){
				case "light":
					thisItem.attr("data-state", item.state?"on":"off");
					break;
				case "temp":
					let temp;
					if(item.temp < 19) temp = "cold";
					else if(item.temp < 24) temp = "normal";
					else temp = "hot";
					thisItem
						.html("<a href='./temp.html?" + item.id + "'>" + item.temp + "&#176;C</a>")
						.attr("data-temp", temp);
					break;
				default:
					console.error("Nieprawidłowy typ obiektu (item.type): " + item.type);
					break;
			}
		}
	}
}

function getDataFromServer(){
	// $.ajax({
	// 	url: address + '/byRoom',
	// 	success: function(groups){
	// 		drawGroups(groups);
	// 		drawSwitchAllOff();
	// 	}
	// }).fail(function(){
	// 	showError("APIconnection");
	// });

	//Get Rooms
	$.ajax({
		url: address + "/rooms",
		async: false,
		success: function (rooms) {
			drawRooms(rooms);
		}
	}).fail(function(){
		showError("APIconnection");
	});

	//Get lights
	$.ajax({
		url: address + "/lights",
		async: false,
		success: function (lights) {
			drawLights(lights);
		}
	}).fail(function(){
		showError("APIconnection");
	});

	//Get temps
		$.ajax({
			url: address + "/temps",
			async: false,
			success: function (temps) {
				drawTemps(temps);
			}
		}).fail(function(){
			showError("APIconnection");
		});
}

function refreshAll(){
	$.ajax({
		url: address + '/byRoom',
		success: drawRefreshed
	});
}

function switchLight(thisItem){
	var id = thisItem.data("id");
	$.ajax({
		url: address + '/lights/switch/id/' + id,
		success: function(res){
			thisItem.attr("data-state", res.state?"on":"off");
		}
	});
}

function switchRoomOff(thisRoom){
	var room = thisRoom.parents('.group').data('room_id');
	$.ajax({
		url: address + '/lights/switch/room/' + room,
		success: function(res){
			thisRoom.parent().siblings().find('.light').attr('data-state', 'off');
		}
	});
}

function switchAllOff(){
	$.ajax({
		url: address + '/lights/switch/off/',
		success: function(res){
			$(".light").attr("data-state", "off");
		}
	});
}

//READY ---------------------
$(function() {
	getDataFromServer();
	drawSwitchAllOff();
	//setInterval(refreshAll, refreshTime); // Set auto-refresh

	//Switching light
	$("#controls").on("click", ".light", function(){
		switchLight($(this));
	});

	//Switching room off
	$("#controls").on("click", ".group-head-off", function(){
		switchRoomOff($(this));
	});

	//Switching all lights off
	$("#controls").on("click", "#all-off", switchAllOff);

});
