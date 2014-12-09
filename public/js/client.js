(function($) {


	var net = {
		POLLING : "polling",
		LONGPOLLING : "longpolling",
		PUSH : "push"
	}
	var TIMEOUT_POLL = 5000;

	var socket;
	var user = {};
	var mode = $('#radio-group :radio:checked').val();
	var updateTimeout;

	$('#radio-group :radio').change(function() {
		var old = mode;
		mode = $(this).val();
		if( mode === net.PUSH ){
			console.log("on change de monde");
			clearTimeout(updateTimeout);
			updateTimeout = null;
			initSocket();

		}else if( old === net.PUSH && mode != net.PUSH){ //la 2e condition c'est parce que j'ai pas confiance en l'evennement 'change'
			convertUser($('#pseudo').val());
		}

	});

	/**
	* Connexion d'un client
	*/ 

	$('#login-form').submit(function(event){
		event.preventDefault();

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
							sendMessage(" a rejoint la conversation");

						}else {
							alert("on va tous mourrir");
						}
					},
					'error': function(e){
						console.log("login.submit: ca c'est mal passé\n"+e);
					}
				});
				break;
			case net.PUSH:

				user.id = $('#pseudo').val();
				
				initSocket();

				socket.emit('login', {
					pseudo: user.id
				});
				socket.emit('newmessage', {
					message: " a rejoint la conversation" 
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

	function initSocket (argument) {
		
		if(socket == undefined) {
			socket = io.connect('http://localhost');

			socket.on('logged', function() {
				logMe();

			});

			socket.on('newuser', function(user) {
				if($('#users #'+user).length > 0){
					console.log(user +" existe deja");
				}else{
					addUserView(user)
				}
			});

			socket.on('disconnected', function(user) {
				$('#' + user).remove();
			});

			/** Affichage nouveau message */
			socket.on('newmessage', function(message) {
				addMessageView(message);
			});
		}
	}

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
		// empecher l'existence de deux appels simultanés à update
		clearTimeout(updateTimeout);
		updateTimeout = null;

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
			error: function(e){
				console.log(e);
			},complete : function (argument) {
				updateTimeout = setTimeout(update,time);
			}
		});
	}

	function convertUser(id) {
		$.ajax({
			url : 'convertUser',
			type : 'post',
			cache : false,
			data : {
				'user': id,
			},
			success : function(res){
				user = res.user;
			},
			error: function(e){
				console.log(e);
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
			$('#modes-button').fadeIn(400);
			$('#users').fadeIn(400);
			$('#message').focus();
			$('.chat-back').css({opacity:1});
		}, 800);

		var $switchMode = $('#radio-group').clone(true);
		$('#radio-group').remove();
		$switchMode.find('.third').removeClass("third");
		$switchMode.addClass('stacked').prependTo('aside');

	}

	function updateView (msgs,users) {
		
		for (var i = 0; i < msgs.length; i++) {
			addMessageView(msgs[i]);
		};

		updateUsers(users);
	}

	function updateUsers (users) {
		var oldUsers = [];

		//enlever les users qui ne sont plus la (et accesoirement recuperer les uid de ceux qui sont la dans)
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

	function destroy() {
		$.ajax({
			'url': 'disconnect',
			'type': 'post',
			'data': {
				'user': user
			},error: function(e){
				console.log(e);
				//reessayer ?
			}
		});
	}


	///unload : PB refresh auto sur les mobiles
	// comment empeche un client de detrure les sessions des autres ???
	$(window).bind("beforeunload", function(){
		if(user.id != undefined){
			destroy(user);
		}
	});

	$(window).unload(function(){
		if(user.id != undefined){
			destroy(user);	
		}
	});

})(jQuery);

