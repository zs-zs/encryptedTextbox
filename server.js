var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
var urlProvider = require('./urlProvider');

app.use('/css', express.static(path.join(__dirname, '/pages/styles')));
app.use('/js', express.static(path.join(__dirname, '/pages/scripts')));

app.get('/', function(req, res) {
	res.sendfile('./pages/index.html');
});

app.get('/:id', function(req, res) {
	if(urlProvider.resolve(req.params.id)) {
		res.sendfile('./pages/index.html');
	} else {
		res.status(404).send('No such file!');
	}
});

app.post('/save', function(req, res) {
	res.send(urlProvider.createNewUrl());
});

io.on('connection', function(socket) {
	socket.on('subscribe', function(fileId) {
		// we could even resolve the fileId via urlProvider 
		// and reject if there are no such file...
		console.log('client subscribed to file ' + fileId);
		socket.join(fileId);
		socket.to(fileId).emit('subscribed');
	});
	socket.on('change', function(fileId, message) {
		// we could persist the changes & handle concurrency...
		socket.to(fileId).emit('changed', message);
	});
	socket.on('disconnect', function() {
		console.log('client disconnected');
	});
});


http.listen(3000, function(){
	console.log('server is listening on *:3000');
});
