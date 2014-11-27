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
	*
	*/
	socket.on('newmessage', function(message) {

	});
})(jQuery);