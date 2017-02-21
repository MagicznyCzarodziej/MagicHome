$(document).ready(function() {
	//Get all temperatures
	$.get('http://192.168.100.28:3000/temp', function(temps){
		console.log("GOT all temperatures");
		console.log("=====================");

		//Generate buttons for lights
		for(i in temps){
			$('#controls').append('<div class="element"><div class="element-label">' + temps[i].name + '</div><div class="element-info" id="temp_' + temps[i].id + '" data-id=' + temps[i].id + ' data-name="' + temps[i].name +'">' + temps[i].temp + ' &#176;C</div></div>');
			if(temps[i].temp < 19) $('#temp_' + temps[i].id).addClass("temp-cold");
			else if(temps[i].temp < 24) $('#temp_' + temps[i].id).addClass("temp-normal");
			else $('#temp_' + temps[i].id).addClass("temp-hot");
		}
	}).fail(function(){
		showError("APIconnection");
	  });
});
