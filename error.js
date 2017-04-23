function showError(type){
	switch(type){
		case "APIconnection":
			$('#controls').html('<div class="error err-connection" onClick="window.location.reload()">Błąd połączenia z serwerem API (' + address + ')</div>');
			break;
	}
}