// Polling chat

function PollChat(uname) {
	this.pseudo = uname;
	this.version = 0;
	this.reloadTime = 10000;  // 10sec.

	this.sendMessage = function (content,callback) {
		var user = this.pseudo;
		$.ajax({
			url: '/send',
			type: 'post',
			dataType: 'json',
			data: {
				'user' : user,
				'message': content
			},
			'success': function(result){
				callback(result);
			},
			'error': function(e){
				alert(e);
			}
		});
	}

	this.getMessages = function (callback) {
		var th = this;
		$.ajax({
			url : '/getMessages',
			type : 'post',
			dataType : 'json',
			data : {
				'version': th.version;
			},
			cache : false,
			success : function(res){
				if(res.okay){
					// callback(result.message);
					th.version = res.version;
				}else {
					alert("on va tous mourrir");
				}
			},
			'error': function(e){
				console.log(e);
			},
			'complete': function(){
				setTimeout('th.getMessages(callback)', th.reloadTime);
			}
		});
	};
	
	this.getUsers = function(callback){
		var t = this;
		
		$.ajax({
			'url': 'chatCore.php',
			'type': 'post',
			'dataType': 'json',
			'data': {
				'mode': 'getUsers'
			},
			'timeout': 30000,
			'cache': false,
			'success': function(result){
				if(result.result){
					callback(result.message);
				}	
			},
			'error': function(e){
				console.log(e);
			},
			'complete': function(){
				t.getUsers(callback);
			}
		});
	};
	}

}