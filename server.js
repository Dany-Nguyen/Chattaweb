var express = require('express');
// var bodyParser = require('body-parser')

var app = express();
var port = 8080;

var io = require('socket.io').listen(app.listen(port));

// app.use(bodyParser.json());

console.log('Serveur: ON');

var mode = {
	POLL : "polling",
	LONGPOLL : "longpolling",
	PUSH : "push"
}

var users = [];
var messages = [];

app.post('/login', function(req, res){
	// var user = req.body.user;
	// console.log(user);
	res.send('hello world');
});

/**
* Gestion d'instance d'utilisateur par une socket
*/

io.sockets.on('connection', function(socket) {
	var me = false;;

	for (var k in users) {
		socket.emit('newuser', users[k]);
	}

	/**
	* Gestion des connexions
	*/

	socket.on('login', function(user) {
		console.log("Nouveau utilisateur: "+JSON.stringify(user));

		me = user;
		me.id = user.pseudo;
		users[me.id] = me;
		socket.emit('logged');
		io.sockets.emit('newuser', me);
	});

	socket.on('disconnect', function() {
		if (!me) {
			return false;
		}
		delete users[me.id];
		io.sockets.emit('disconnected',me);
	})

	/**
	* Gestion des messages
	*/
	socket.on('newmessage', function(message) {
		message.user = me;
		date = new Date();
		message.heure = date.getHours();
		message.minute = date.getMinutes();
		io.sockets.emit('newmessage', message);
	});
});