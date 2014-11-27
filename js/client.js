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

	socket.on('logged', function() {
		$('#login').fadeOut();
		$('#chat').fadeIn();
		$('#message').focus();

	});

	socket.on('newuser', function(user) {
		$('#users').append('<p id="' + user.id + '">' + user.id + '</p>');
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
		$('#chat-messages').append('<li> <b>' + message.user.id + '</b> (' + message.heure + 'h' + message.minute + ') : ' + message.message + '</li>');
	});
})(jQuery);