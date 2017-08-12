function drawRooms(rooms) {
	for(i in rooms){
		$('#controls').append('<div class="group" data-room="' + rooms[i].name + '" data-room_id="' + rooms[i].id + '"><div class="group-head">' + rooms[i].name + '<div class="group-head-off"><i class="fa fa-power-off"></i></div></div><div class="group-items"></div></div>');
	}
}

function drawLights(lights) {
	for(i of lights){
		let roomID = i.room_id,
				id = i.id,
				description = i.description,
				state = i.state;

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
		url: API_IP + "/temps/" + id,
		success: function (data) {
			callback(data);
		}
	});
}

function drawTemps(temps) {
	for(i of temps){
		let roomID = i.room_id,
				id = i.id,
				description = i.description,
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

function drawSwitchAllOff(){
	$('#controls').append('<div id="all-off"><i class="fa fa-power-off"></i><br><span style="font-family: Orbitron;"> Wylacz wszystkie swiatla</span></div>');
}

function refreshLights(lights) {
	for(i of lights){
		let roomID = i.room_id,
				id = i.id,
				state = i.state;

		let room = $('.group[data-room_id="' + roomID + '"] .group-items');
		let item = $('.group-item[data-id="' + id + '"]');
		item.attr({"data-state": (state?"on":"off")});
	}
}

function refreshTemps(temps) {
	for(i of temps){
		let roomID = i.room_id,
				id = i.id,
				temp,
				tempType;

		getTemp(id, function (data) {
			temp = data[1];

			if(temp < 19) tempType = "cold";
			else if(temp < 24) tempType = "normal";
			else tempType = "hot";

			let room = $('.group[data-room_id="' + roomID + '"] .group-items');
			let item = $('.group-item[data-id="' + id + '"]');
			item.attr({"data-temp": tempType})
					.html("<a href='./temp.html?" + id + "'>" + temp + "&#176;C</a>");
		});
	}
}

function prepareRooms() {
	//Get Rooms
	$.ajax({
		url: API_IP + "/rooms",
		async: false,
		success: function (rooms) {
			drawRooms(rooms);
		}
	}).fail(function(){
		showError("APIconnection");
	});
}

function updateLights(firstTime) {
	//Get lights
	$.ajax({
		url: API_IP + "/lights",
		async: false,
		success: function (lights) {
			if(firstTime) drawLights(lights);
			else refreshLights(lights);
		}
	}).fail(function(){
		showError("APIconnection");
	});
}

function updateTemps(firstTime) {
	//Get temps
	$.ajax({
		url: API_IP + "/temps",
		async: false,
		success: function (temps) {
			if(firstTime) drawTemps(temps);
			else refreshTemps(temps);
		}
	}).fail(function(){
		showError("APIconnection");
	});
}

function switchLight(thisItem){
	let id = thisItem.data("id");
	$.ajax({
		url: API_IP + '/lights/switch/id/' + id,
		success: function(res){
			thisItem.attr("data-state", res.state?"on":"off");
		}
	});
}

function switchRoomOff(thisRoom){
	let room = thisRoom.parents('.group').data('room_id');
	$.ajax({
		url: API_IP + '/lights/switch/room/' + room,
		success: function(res){
			thisRoom.parent().siblings().find('.light').attr('data-state', 'off');
		}
	});
}

function switchAllOff(){
	$.ajax({
		url: API_IP + '/lights/switch/off/',
		success: function(res){
			$(".light").attr("data-state", "off");
		}
	});
}

function setup() {
	prepareRooms();
	updateLights(true);
	updateTemps(true);
	drawSwitchAllOff();

	setInterval(updateLights, refreshTime);
	setInterval(updateTemps, 60*1000);
}

//READY ---------------------
$(function() {
	setup();

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
