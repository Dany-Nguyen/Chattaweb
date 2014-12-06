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


var timeoutLP = 30000;
Date.now = Date.now || function() { return +new Date; };  //TO SUPPORT IE < IE9  (ES5)

var users = [];
var messages = [];


app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});


app.post('/login',function(req, res) {
	var user = {};

	user.id = req.body.user;
	user.version = messages.length;
	user.mode = req.body.mode;
	user.pm = [];


	users[user.id] = user;
	
	console.log("Nouvel utilisateur: "+user.id);

	res.send({
		okay:true,
		me: user,
		users: users.map(function (u) {
			return u.id;
		})
	});	
});


app.post('/sendMessage', function(req, res){
	var message = {};
	message.message = req.body.message;
	message.user = req.body.user;
	date = new Date();
	message.heure = date.getHours();
	message.minute = date.getMinutes();

	var u = req.body.user;
	users[u.id] = u;

	messages.push(message);

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
		users: users
	});
});

app.post('/register-lp', function(req, res){

	// res.connection.setTimeout(0);

	var u = req.body.user;
	var oldversion = u.version;
	
	var lptimer = setTimeout(function() {
		clearInterval(lpInterval);
		res.send({
			timeout:true
		});
		return;
	},timeoutLP);

	var lpInterval = setInterval(function() {
		if(oldversion < messages.length){
			clearTimeout(lptimer);
			clearInterval(lpInterval);

			//////////////////////////////////////// 		UPDATE COPIE COLLE, C'EST SALE
			var u = req.body.user;
			var msgs =[];
			msgs = messages.slice(u.version,messages.length);
			u.version = messages.length;
			users[u.id] = u;

			res.send({
				okay: true,
				me: u,
				messages: msgs,
				users: users
			});
			//////////////////////////////////////:
		}
	},10);
	
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
		console.log("Nouvel utilisateur: "+JSON.stringify(user));

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
	});

	/**
	* Gestion des messages
	*/
	socket.on('newmessage', function(message) {
		message.user = me;
		date = new Date();
		message.heure = date.getHours();
		message.minute = date.getMinutes();

		messages.push[message];
		
		io.sockets.emit('newmessage', message);
	});

});

console.log('Serveur : ON');
