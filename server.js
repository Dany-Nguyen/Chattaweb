var express = require('express'); 
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var bodyParser = require('body-parser');

server.listen(80);

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));


Date.now = Date.now || function() { return +new Date; };  //TO SUPPORT IE < IE9  (ES5)

var timeoutLP = 30000;
var users = {};
var messages = [];

app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
});

app.post('/login',function(req, res) {
	var user = {};

	user.id = req.body.user;
	user.version = messages.length;

	users[user.id] = user;
	
	console.log("Nouvel utilisateur: "+user.id);

	res.send({
		okay:true,
		me: user,
		users: Object.keys(users)
	});	
});

app.post('/convertUser', function(req, res){
	var user = {};
	console.log(JSON.stringify(req.body));
	user.id = req.body.user;
	user.version = messages.length;
	console.log(JSON.stringify(user));
	res.send({user : user});
});

app.post('/sendMessage', function(req, res){
	var message = {};
	message.message = req.body.message;
	message.user = req.body.user.id;
	date = new Date();
	message.heure = date.getHours();
	message.minute = date.getMinutes();

	var u = req.body.user;
	users[u.id] = u;
	messages.push(message);

	if(areSockClients()){
		io.sockets.emit('newmessage', message);
	}

	res.send({
		okay:true
	});
});

app.post('/update', function(req, res){
	var u = req.body.user;
	var msgs =[];

	var isOkay = false;
	var isNothing = false;

	if(u.version < messages.length){
		console.log("smthng to update");
		isOkay = true;
		
		msgs = messages.slice(u.version,messages.length);
		u.version = messages.length;
		users[u.id] = u;
		
	}else if(u.version == messages.length){
		isNothing = true;
	}else{
		console.log("error: the version is greater than the messages.length \nu.version:"+u.version+"\nmessages.length:"+messages.length);
	}

	res.send({
		okay: isOkay,
		nothing: isNothing,
		me: u,
		messages: msgs,
		users: Object.keys(users)
	});
});

app.post('/register-lp', function(req, res){
	// res.connection.setTimeout(0);

	var u = req.body.user;
	var oldversion = u.version;
	var usersSize = Object.keys(users).length;
	var lptimer = setTimeout(function() {
		clearInterval(lpInterval);
		res.send({
			timeout:true,
			users:Object.keys(users)
		});
		return;
	},timeoutLP);

	var lpInterval = setInterval(function() {
		
		if(oldversion < messages.length ){
			clearTimeout(lptimer);
			clearInterval(lpInterval);

			//////////////////////////////////////// 		UPDATE
			var u = req.body.user;
			var msgs =[];
			msgs = messages.slice(u.version,messages.length);
			u.version = messages.length;

			users[u.id] = u;

			res.send({
				okay: true,
				me: u,
				messages: msgs,
				users: Object.keys(users)
			});
			//////////////////////////////////////:
		}
	},10); // on  attends un peu, on est pas à la milliseconde près
	
});

app.post('/disconnect',function(req, res) {
	var user = req.body.user;
	

	if(users[user.id] != undefined){
		console.log("utilisateur parti: "+user.id);
		delete users[user.id];
		io.sockets.emit('disconnected',user.id);

	}else{
		console.log("disconnect: error");
	}

	res.sendStatus(200);
});


function areSockClients() {
	return io.sockets.sockets.length > 0;
}


/**
* Gestion d'instance d'utilisateur par une socket
*/

io.sockets.on('connection', function(socket) {
	var me = false;;
	
	for (var k in users) {
		socket.emit('newuser', users[k].id);
	}

	/**
	* Gestion des connexions
	*/

	socket.on('login', function(user) {
		console.log("Nouvel utilisateur: "+user.pseudo);

		if(user.id in users){
			console.log("on va pas tout faire");

		}else{
			console.log("on peux inserer")

		}
		me = user;
		me.id = user.pseudo;
		users[me.id] = me;
		socket.emit('logged');
		io.sockets.emit('newuser', me.id);
	});

	socket.on('disconnect', function() {
		if (!me) {
			return false;
		}
		delete users[me.id];
		io.sockets.emit('disconnected',me.id);
	});

	/**
	* Gestion des messages
	*/
	socket.on('newmessage', function(message) {
		message.user = me.id;
		date = new Date();
		message.heure = date.getHours();
		message.minute = date.getMinutes();

		io.sockets.emit('newmessage', message);
		
		// mettre a jour les messages globaux
		messages.push(message);

	});

});

console.log('Serveur : ON');
