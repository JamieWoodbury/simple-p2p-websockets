var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
  res.sendfile('index.html');
});

var connections = {}
var onlineUsers = function(){
  users = [];
  for(var userID in connections) users.push(userID);

  return users;
};

io.on('connection', function (socket){

  socket.userID = socket.handshake.query.userID;
  connections[socket.userID] = socket;
  console.log('New User! ', socket.userID);

  io.emit('onlineUsers', onlineUsers());

  socket.on('disconnect', function() {
    delete connections[socket.userID];
    io.emit('onlineUsers', onlineUsers());
    console.log(socket.userID, " has left!");
  });

  socket.on('message', function(msg){
    var outgoingSocket = connections[msg.to]
    socket.emit('message', msg);
    outgoingSocket.emit('message', msg);
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});