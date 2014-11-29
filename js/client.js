(function($) {
	var socket = io.connect('http://localhost:8080');

	/**
	* Connexion d'un client
	*/ 

	$('#login-form').submit(function(event){
		event.preventDefault();
		socket.emit('login', {
			pseudo: $('#pseudo').val()
		})
	});

	$('#message').on('keyup', function(e) {
		var checked = $('#check-enter').is(':checked');
		if (checked && e.which == 13 && ! e.shiftKey) {
			$('#chat-form').submit();
		}
	});

	socket.on('logged', function() {
		$('#login').slideUp(400);
		$('#chatchat').slideDown(400).delay(200).fadeOut(200);
		$("body").css("background-color","#ddd");
		$("body").fadeTo(1000, 1, function() {
			$(this).css("background-image","url(img/chat.png)");
			$(this).css("background-repeat","no-repeat");
			$(this).css("background-position","right");
			$(this).css("transition", "opacity 2s ease-in-out");
		});
		

		setTimeout(function() {
			$('#chat').fadeIn(400);
			$('#users').fadeIn(400);

			$('#message').focus();

		}, 800);
		
	});

	socket.on('newuser', function(user) {
		$('#users').append('<div class="user" id="' + user.id + '">' + user.id + '</div>');
	});

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
	* Affichage nouveau message
	*/
	socket.on('newmessage', function(message) {
		if (message.user.id == $('#pseudo').val()) {
			$('#chat-messages').append('<li> <span class="mon-message"><b>' + message.user.id + '</b> (' + message.heure + 'h' + message.minute + ') :</span> ' + message.message + '</li>');
		}	
		else {
			$('#chat-messages').append('<li> <b>' + message.user.id + '</b> (' + message.heure + 'h' + message.minute + ') : ' + message.message + '</li>');
		}
	});
})(jQuery);