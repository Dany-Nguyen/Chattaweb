(function($) {


	var net = {
		POLLING : "polling",
		LONGPOLLING : "longpolling",
		PUSH : "push"
	}
	var TIMEOUT_POLL = 5000;

	var socket;
	var user = {};
	var mode;
	var updateTimeout;

	/**
	* Connexion d'un client
	*/ 

	$('#login-form').submit(function(event){
		event.preventDefault();
		mode = $(this).find('input[type=radio]:checked').val();

		switch(mode){
			case net.POLLING:
			case net.LONGPOLLING:
				$.ajax({
					url : 'login',
					type : 'post',
					data : {
						'user': $('#pseudo').val(),
						'mode': mode
					},
					cache : false,
					success : function(res){
						if(res.okay){
							user = res.me;
							logMe();
							update();
						}else {
							alert("on va tous mourrir");
						}
					},
					'error': function(e){
						console.log("ca c'est mal passé\n"+e);
					}
				});
				break;
			case net.PUSH:
				socket = io.connect('http://localhost');

				user.id = $('#pseudo').val();
				
				////////////////////////////////////SOCKETS

				socket.on('logged', function() {
					logMe();
				});

				socket.on('newuser', function(user) {
					addUserView(user)
				});

				socket.on('disconnected', function(user) {
					$('#' + user).remove();
				});

				/** Affichage nouveau message */
				socket.on('newmessage', function(message) {
					addMessageView(message);
				});

				socket.emit('login', {
					pseudo: user.id
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


	$('#chat-form').submit(function(event) {
		event.preventDefault();

		var msg =  $('#message').val();

		switch(mode){
			case net.POLLING:
			case net.LONGPOLLING:
				sendMessage(msg);
				break;
			case net.PUSH:
				socket.emit('newmessage', {message: msg });		
				break;
			default:
				alert("don't try my submit");
		}

		$('#message').val('');
		$('#message').focus();
	});

	function sendMessage (message) {
		$.ajax({
			url : 'sendMessage',
			type : 'post',
			data : {
				'user':user,
				'message': message
			},
			cache : false,
			success : function(res){
				if(res.okay){
					if(mode === net.POLLING){ update();}
				}else {
					alert("on va tous mourrir:sendMessage");
				}
			},
			'error': function(e){
				console.log("sendMessage:ajax: ca c'est mal passé\n");
			}
		});
	}


	

	function update() {
		//empecher l'existence de deux appels simultanés à update
		clearTimeout(updateTimeout);

		// console.log("going to update :");
		var addr;
		var time;
		if(mode === "polling"){
			addr = 'update';
			time = TIMEOUT_POLL;
		}else if (mode === "longpolling"){
			addr = 'register-lp';
			time = 200;
		}else {
			alert("update: mode incorrect :"+mode);
		}

		$.ajax({
			url : addr,
			type : 'post',
			data : {
				'user': user,
			},
			cache : false,
			success : function(res){
				if(res.okay){
					user = res.me;
					console.log("updated successfully to version : "+ user.version);
					updateView(res.messages,res.users);
				}else if(res.nothing) {
					updateUsers(res.users)
				}else if(res.timeout) {
					console.log("timeout LP");
				}else{
					alert("update:ajax: on va tous mourrir !");
				}
			},
			'error': function(e){
				// console.log("update:ajax: error "+e);
			},complete : function (argument) {
				updateTimeout = setTimeout(update,time);
			}
		});
	}


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

	function updateView (msgs,users) {
		
		for (var i = 0; i < msgs.length; i++) {
			addMessageView(msgs[i]);
		};

		updateUsers(users);
	}

	function updateUsers (users) {
		var oldUsers = [];

		//enlever les users qui ne sont plus la (et acesoirement recuperer les uid de ce qui sont la dans)
		$('#users .user').each(function() {
			oldUsers.push(this.id);
			if($.inArray( this.id, users) == -1){
				$(this).slideUp(function(){
					this.remove();
				});
			}
		});
		//rajouter les users que ne sont pas la
		for (var i = users.length - 1; i >= 0; i--) {
			if($.inArray( users[i], oldUsers) == -1) {
				addUserView(users[i]);
			}
		};
		//je pourrais fair un seul parcours (double) plutot que deux mais c'est que n²+n² environ donc ca va
	}

	function addMessageView(msg) {
		var isme = (msg.user == user.id) ? "mon-message" : "";
		$('#chat-messages').append('<li> <span class="'+isme+'"><b>' + msg.user + '</b> (' + msg.heure + 'h' + msg.minute + ') :</span> ' + msg.message + '</li>');
	}

	function addUserView(uid) {
		$('#users').append('<div class="user" id="' + uid + '">' + uid + '</div>');
	}



})(jQuery);

