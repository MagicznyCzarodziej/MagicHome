$(document).ready(function() {
	//Get state of all lights
	$.get('http://192.168.100.28:3000/lights', function(lights){
		console.log("GOT state of all pins");
		console.log("=====================");

		//Generate buttons for lights
		for(i in lights){
			$('#controls').append('<div class="element"><div class="element-label">' + lights[i].name + '</div><div class="element-button" id="led_' + lights[i].id + '" data-id=' + lights[i].id + ' data-name="' + lights[i].name +'"><i class=" fa fa-lightbulb-o"></i></div></div>');
			//Set colors based on states
			if(lights[i].state) $('#led_' + lights[i].id).addClass("light-on");
		}
		$('#controls').append('<div class="element"><div class="element-label">Wszystkie OFF</div><div class="element-button all-off"><i class="fa fa-ban"></i></div></div>');
	}).fail(function(){
		showError("APIconnection");
	  });

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
				if(res.success){
					console.log("All lights OFF");
					$(".element-button:not(.all-off)").removeClass("light-on");
				}
			}
		});
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
});
