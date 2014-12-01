(function($) {
	var socket = io.connect('http://localhost:8080');

	/**
	* Connexion d'un client
	*/ 
	$('#login-form').submit(function(event){
		event.preventDefault();
		if ($('#' + $('#pseudo').val()).length) { // Pseudo déjà utilisé
			alert("Pseudo déjà utilisé");
		} else { // Connexion OK
			socket.emit('login', {
				pseudo: $('#pseudo').val()
			})
		}
	});

	/** 
	* Raccourci bouton entrée pour l'envoi de message
	*/
	$('#message').on('keyup', function(e) {
		var checked = $('#check-enter').is(':checked');
		if (checked && e.which == 13 && ! e.shiftKey) {
			$('#chat-form').submit();
		}
	});

	/**
	* Affichage du chat et des messages
	*/
	socket.on('logged', function() {
		$('#login').slideUp(400);
		// Chat en ASCII
		$('#chatchat').slideDown(400).delay(200).fadeOut(200);
		$("body").css("background-color","#ddd");
		// Chat en background
		$("body").fadeTo(1000, 1, function() {
			$(this).css("background-image","url(img/chat.png)");
			$(this).css("background-repeat","no-repeat");
			$(this).css("background-position","right");
			$(this).css("background-size", "auto 100%");
			$(this).css("transition", "opacity 2s ease-in-out");
		});
		

		setTimeout(function() {
			$('#chat').fadeIn(400);
			$('#users').fadeIn(400);

			$('#message').focus();

		}, 800);
		
	});

	/**
	* Ajout du pseudo dans la liste des pseudos connectés
	*/
	socket.on('newuser', function(user) {
		$('#users').append('<div class="user" id="' + user.id + '">' + user.id + '</div>');
	});

	/**
	* Suppression du pseudo dans la liste des pseudos connectés
	*/
	socket.on('disconnected', function(user) {
		$('#' + user.id).remove();
	});

	/**
	* Envoi de message
	*/
	$('#chat-form').submit(function(event) {
		event.preventDefault();
		socket.emit('newmessage', {message: $('#message').val() });
		$('#message').val('');
		$('#message').focus();
	})

	/**
	* Affichage de nouveau message
	*/
	socket.on('newmessage', function(message) {
		if (message.user.id == $('#pseudo').val()) { // Nouveau message de moi
			$('#chat-messages').append('<li> <span class="mon-message"><b>' + message.user.id + '</b> (' + message.heure + 'h' + message.minute + ') :</span> ' + message.message + '</li>');
		}	
		else { // Nouveau message des autres
			$('#chat-messages').append('<li> <b>' + message.user.id + '</b> (' + message.heure + 'h' + message.minute + ') : ' + message.message + '</li>');
		}
	});
})(jQuery);