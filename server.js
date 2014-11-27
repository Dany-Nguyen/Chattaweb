var http = require('http');

var server = http.createServer(function(req, res) {
});
server.listen(8080);
console.log('Serveur: ON');

var io = require('socket.io').listen(server);
var users = [];


/**
* Gestion d'instance d'utilisateur
*/

io.sockets.on('connection', function(socket) {
	var me = false;;
	console.log("Nouveau utilisateur");

	for (var k in users) {
		socket.emit('newuser', users[k]);
	}

	/**
	* Gestion des connexions
	*/

	socket.on('login', function(user) {
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