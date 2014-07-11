A recent challenge I came across while studying at [Lighthouse Labs][ll] was to find a way to allow two users to pass information to one another. Having recently learned about Web Sockets, that seemed like a promising place to start. Unfortunately, while there were a several resources on how to create chatrooms using Web Sockets, I couldn't seem to find any solution to my problem of sending a message from one user to another without any others intercepting it. So, after much banging my head against the wall, I came up with my own solution using Socket.io which I thought I would share in case others find it useful.

For those unfamiliar with Socket.io, there is a great tutorial [here][socketIO] that will walk you through building a basic chat application that broadcasts messages to all users connected to the socket server. I'll be using this as a starting point for my application, so I recommend you go through the tutorial yourself to get started.

First thing first, we need some way of identifying the users on our site. If you're trying to send messages from peer to peer, odds are you already have some kind of session control, but for simplicity we'll just prompt for a name when our users access the site. We can then pass this information down to our server as a query string in the server url.

```javascript
var userID = prompt("Your name");
var socket = io.connect({query: 'userID='+String(userID)});
```

And on the server side, lets create an object to keep track of all of our open sockets.

```javascript
//...

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

  socket.on('disconnect', function() {
    delete connections[socket.userID];
    console.log(socket.userID, " has left!");
  });

  //...
```

Now, we want to let our users know who's online and who isn't, so let's broadcast a list of online users every time a connection is started or ended. 

```javascript
io.on('connection', function (socket){

  //...

  io.emit('onlineUsers', onlineUsers());

  socket.on('disconnect', function() {
    //...
    io.emit('onlineUsers', onlineUsers());
  });
```

And on the client side let's handle this by updating our select box to include a list of online users.

```javascript
socket.on('onlineUsers', function(users){
  $('#users').empty();
  $.each(users, function(i, user){
    if (user != userID){
      $('#users').append($('<option>').text(user));
    };
  });
});
```

Cool. If you've followed so far, we're almost there. All that's left is to encode our message with some basic sender/receiver information and configure our server to relay to the right address. So, on our client we need to add:

```javascript
$('form').submit(function(){
  var message = {
    to: $('#users').val(),
    from: userID,
    message: $('#m').val()
  }
  socket.emit('message', message);
  $('#m').val('');
  return false;
});
socket.on('message', function(msg){
  $('#messages').append($('<li>').text(msg.from + ': ' + msg.message));
});
```

And on the server:

```javascript
socket.on('message', function(msg){
  var outgoingSocket = connections[msg.to]
  outgoingSocket.emit('message', msg);
});
```

That's it. Just open a few tabs and play around by sending messages to specific users. Cool, huh? If you didn't follow along, not to worry, you can get the full source [here][repo].


[ll]: http://www.lighthouselabs.ca/
[socketIO]: http://socket.io/get-started/chat/
[repo]: https://github.com/JamieWoodbury/simple-p2p-websockets
