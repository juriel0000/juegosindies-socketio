var express = require('express');  
var app = express();  
var server = require('http').createServer(app);  
var io = require('socket.io')(server,{'pingInterval': 2000, 'pingTimeout': 5000});


var millis = 1000.0 * (1 / 60.0);
var lastIdd = 0;
var gameObjects = [];
var players = [];
var nextMermaidGeneration = 10000;

app.use(express.static(__dirname ));  
app.get('/', function(req, res,next) {  
    res.sendFile(__dirname + '/index.html');
});

var openConnections = new Map();
var lastConnectionId = 0; 
function connectionManager(socket){

    console.log('Client connected...'+lastConnectionId   );
    socket.connectionId = lastConnectionId;    
    openConnections.set(socket.connectionId,socket);
    lastConnectionId++;
    var ship = "ship0"+socket.connectionId % 4;
    var player = {
         x:10,
         y:getRandomArbitrary(10,760),
         width:120, 
         height:90, 
         type:ship,
         muerto: false,
         label:"Pirata "+socket.connectionId
    };
    addObject2Game(player);
    socket.player = player;
    socket.emit('assignPlayer',player );
    socket.on('update', function(data){ updateReceived(socket,data);});   
    socket.on('keyDown', function(data){ keyDownReceived(socket,data);});   
    socket.on('disconnect', function() {
        console.log("disconnect from "+socket);
        openConnections.delete(socket.connectionId);
        removeObjectFromGame(socket.player.uid);
    }); 
}


console.log("Configure io");    
io.on('connection', connectionManager);

server.listen(4200);  
console.log("Listen on 4200");    

var io2 = require('socket.io')();


io2.on('connection', connectionManager);
io2.attach(4201, {
        pingInterval: 10000,
        pingTimeout: 60000,
        cookie: false
});
console.log("Listen on 4201");    
//------------------- GAME ------------------------------


var rockPositions = [180,180,
                     840,180,
                     600,320,
                     240,420,
                     180,600, 
                     840,600];


//-------------------  GameObject Array ----------------------
function addObject2Game(obj){
     obj.uid = lastIdd;
     gameObjects.push(obj);
     lastIdd++;
}

function removeObjectFromGame(uid){
    index = -1;
    for (i = 0 ; i < gameObjects.length ; i++){
        var obj = gameObjects[i];
        if (obj.uid == uid){
            index = i;
        }
    }
    if (index == -1){
        return;
    }
    gameObjects.splice(index,1);
}

function findAllGameObjectByType(type){
    resp = [];
    for (i = 0 ; i < gameObjects.length ; i++){
        if (type == gameObjects[i].type){
            resp.push(gameObjects[i]);
        }
    }
    return resp;
}

//----------------------------------------------------------
//       Game Logic
//----------------------------------------------------------

function initGame(){

    for(i = 0 ; i < (rockPositions.length/2) ; i ++){
         var rock = {};
         rock.type = 'rock';
         rock.x = rockPositions[i*2];
         rock.y = rockPositions[i*2+1];
         rock.width = 100;
         rock.height = 47;
         rock.mermaid = false;
    
        addObject2Game(rock);
   }
}

function update(){
    for (i = 0 ; i < gameObjects.length ; i++){
        var obj = gameObjects[i];
        if (obj.type == 'rock' &&  obj.mermaid){
            obj.mermaidLeft -= millis;
            if ( obj.mermaidLeft < 0 ){
                obj.mermaid  = false;
                removeObjectFromGame(obj.mermaidUID);
            }
        } 
        else if (obj.type == 'mine'){
            obj.timeLeft -= millis;
            if ( obj.timeLeft < 0 ){                
                removeObjectFromGame(obj.uid);
            }
        } 
    }
    // Mermaid Generation
    nextMermaidGeneration -= millis;
    if (nextMermaidGeneration <=0 ){
        nextMermaidGeneration = getRandomArbitrary(3000,10000);
        rocks = findAllGameObjectByType('rock');
        rand = Math.floor(getRandomArbitrary(0,rocks.length-1));
        if (!rocks[rand].mermaid ){
            rocks[rand].mermaid = true;
            rocks[rand].mermaidLeft = 10000;
            var mermaid = {x:rocks[rand].x+20 ,y:rocks[rand].y-70, width:65,height:150, type:'mermaid'};
            addObject2Game(mermaid);
            rocks[rand].mermaidUID = mermaid.uid;
        }
    }
}


//---------------------------------------------------
//  Communications Section
//----------------------------------------------------
function updateReceived(socket, data){
   // console.log("Update Received "+socket.connectionId+" "+data);
    socket.emit('update',gameObjects);    
}

function keyDownReceived(socket, data){
    //console.log("keyDown Received "+socket.connectionId+" "+data);
    if (data == 'space'){
        var mine = {type:'mine', x:socket.player.x,y:socket.player.y,width:100,height:76,timeLeft: 5000};
        addObject2Game(mine);
        return;
    }
        
    step = 10;
    player = socket.player;
    newX = socket.player.x;
    newY = socket.player.y;
    if (data == 'left'){
        newX-= 10;
    }   
    if (data == 'right'){
        newX+= 10;
    }   
    if (data == 'up'){
        newY -= 10;
    }   
    if (data == 'down'){
        newY += 10;
    }   
    
    if (newX < 0 ){
        newX = 0 ;
    }
    else if(newX >= 1024-player.width) {
        newX = 1024-player.width;
    }
    if (newY < 0 ){
        newY = 0 ;
    }
    else if(newY >= 768-player.height) {
        newY = 768-player.height;
    }
    var temp = {x:newX, y:newY, width: player.width, height:player.height};
    for (i = 0 ; i < gameObjects.length ; i++){
        var obj = gameObjects[i];
        if (obj != player){
            if(collisionAABB(obj, temp)){
                if(obj.type  != 'mine'){
                    return; 
                    
                }
                else {
                     player.muerto = true;
                }
            }
        }
    }
    player.x = newX;
    player.y = newY;
}

//===============================================================
//              Utils
//===============================================================

function collisionAABB(rect1,rect2){
     
    if (rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
       rect1.y < rect2.y + rect2.height &&
       rect1.height + rect1.y > rect2.y) {
        return true;
    }
    return false;
}
function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}


initGame();
setInterval(update, millis);


