function changeAPI(){
	var ip = prompt("Adres: ", "192.168.100.28");
	document.cookie = "API=" + ip + ";expires=Fri, 31-Dec-9999 23:59:59 GMT";
	
	$('#API').text("IP: " + ip);
}

$(document).ready(function() {
	$('#controls').append('<div class="group" data-setting="API"><div class="group-head">API</div></div>');
	$('.group[data-setting="API"]').append('<div class="group-items"><div class="group-item setting" id="API" onClick="changeAPI()">IP: ' + ip + '</div></div>'); //Raw IP without http and port
});
