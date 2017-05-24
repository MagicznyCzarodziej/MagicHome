function changeAPI(){
	var ip = prompt("Adres API: ", "192.168.100.28");
	Cookies.set('API', ip, {expires: new Date(9999, 12, 31)});

	$('#API').text("IP: " + ip);
}

function changeRefreshTime() {
	do{
		var refreshTime = parseInt(prompt("Czas odświeżania (ms) >= 1000", 1000));
	}while(refreshTime < 1000);
	Cookies.set('REFRESH_TIME', refreshTime, {expires: new Date(9999, 12, 31)});

}
$(document).ready(function() {
	//API Address
	$('#controls').append('<div class="group" data-setting="API"><div class="group-head">API</div></div>');
	$('.group[data-setting="API"]').append('<div class="group-items"><div class="group-item setting" id="API" onClick="changeAPI()">IP: ' + ip + '</div></div>'); //Raw IP without http and port

	//Refresh time
	$('#controls').append('<div class="group" data-setting="refreshTime"><div class="group-head">Odswiezanie</div></div>');
	$('.group[data-setting="refreshTime"]').append('<div class="group-items"><div class="group-item setting" id="refreshTime" onClick="changeRefreshTime()">Czas: ' + refreshTime + 'ms</div></div>');
});
