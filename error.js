function showError(type){
	switch(type){
		case "APIconnection":
			console.error("Błąd połączenia z serwerem API: " + address);
			$('#controls').html('<div class="error err-connection" onClick="window.location.reload()">Blad polaczenia z serwerem API (' + address + ')</div>');
			break;
	}
}
