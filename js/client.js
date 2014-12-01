(function($) {

	var socket = io.connect('http://localhost:8080');


	/**
	* Connexion d'un client
	*/ 

	$('#login-form').submit(function(event){
		event.preventDefault();
		var mode = $(this).find('input[type=radio]:checked').val();

		switch(mode){
			case "polling":
				$.ajax({
					url : 'http://127.0.0.1/Chattaweb/login',
					type : 'post',
					// dataType : 'json',
					data : {
						'user': $('#pseudo').val(),
						'mode': mode
					},
					cache : false,
					success : function(res){
						if(res.okay){
							// callback(result.message);
							// th.version = res.version;
						}else {
							alert("on va tous mourrir");
						}
					},
					'error': function(e){
						// console.log(e);
					}
				});
				break;
			case "longpolling":
				alert(mode);
				break;
			case "push":

				socket.emit('login', {
					pseudo: $('#pseudo').val()
				});
				break;
			default:
				alert("don't try me");
		}
	});

	$('#message').on('keyup', function(e) {
		var checked = $('#check-enter').is(':checked');
		if (checked && e.which == 13 && ! e.shiftKey) {
			$('#chat-form').submit();
		}
	});

	socket.on('logged', function() {
		logMe();
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
	});

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

function logMe () {
	$('#login').slideUp(400);
	$('#chatchat').slideDown(400).delay(200).animate({
		right : "50px",
		opacity : 0,
		"margin-top" : "20%",
		"margin-right" : 0			
	},{
		duration:200,	
		complete: function(){ $(this).fadeOut(); }
	});
	
	$("body").addClass("logged");

	$('body').prepend('<img class="chat-back" src="img/chat.png" style="opacity:0" />');

	setTimeout(function() {
		$('#chat').fadeIn(400);
		$('#users').fadeIn(400);

		$('#message').focus();

		$('.chat-back').css({opacity:1});

	}, 800);
}