var express = require('express');  
var app = express();  
var server = require('http').createServer(app);  
var io = require('socket.io')(server,{'pingInterval': 2000, 'pingTimeout': 5000});

var player = {x:100,y:100};

app.use(express.static(__dirname ));  
app.get('/', function(req, res,next) {  
    res.sendFile(__dirname + '/index.html');
});

var lastId = 0;
io.on('connection', function (socket){
      socket.connectionId = lastId++;
      console.log("Conexión recibida "+socket.connectionId);
      socket.on('disconnect', function(){ 
           console.log("Desconexion "+socket.connectionId);
      } );
      socket.on('keyDown', function(key) {keyDownReceived(socket,key);});
      socket.on('update', function(key) {
           console.log('update');
           socket.emit('playerUpdate', player);
      });
});

function keyDownReceived(socket,key){
    console.log('keyDownReceived '+key);
    if (key == 'left'){
        player.x -=10;
    }
    if (key == 'right'){
        player.x +=10;
    }
    if (key == 'up'){
        player.y -=10;
    }
    if (key == 'down'){
        player.y +=10;
    }
    socket.emit('playerUpdate', player);
}

server.listen(4200);  




