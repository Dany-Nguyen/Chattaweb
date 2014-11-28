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
		var $li = $('<li style="display:none;"> <b>' + message.user.id + '</b> (' + message.heure + 'h' + message.minute + ') : ' + message.message + '</li>');
		$li.appendTo($('#chat-messages'));
		$li.show();
	});
})(jQuery);