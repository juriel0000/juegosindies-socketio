var game = new Phaser.Game(1024, 768, Phaser.AUTO, 'game', { preload: preload, create: create, update: update });


var updatingStatus = 0;
var ws = null;
var status = 'LOGIN';
var player = null;
var aviso = null;
var socket = null;
var ticks = 5000;
var gameObjects = [];
//======================================================
//        P R E L O A D    I M A G E S
//======================================================

function preload() {
    game.load.image('barco', 'img/barquito.png');
    game.load.image('background', 'img/background.png');
    game.load.image('waves', 'img/waves.png');
    game.load.image('mermaid', 'img/mermaid.png');
    game.load.image('mine', 'img/mine.png');
    game.load.image('rock', 'img/rock.png');
    game.load.image('ship00', 'img/ship00.png');
    game.load.image('ship01', 'img/ship01.png');
    game.load.image('ship02', 'img/ship02.png');
    game.load.image('ship03', 'img/ship03.png');
}

//======================================================
//        C R E A T E
//======================================================

function create() {
    background = game.add.sprite(0, 0, 'background');
    aviso = game.add.text(10,10,"MENSAJES DEL SOCKET");
    
    for (i = 0 ; i < 6 ; i ++){
        var wave = game.add.sprite(getRandomArbitrary(20,1024-380-20),i*150+20, 'waves');        
    } 
    
    socket = io('ws://localhost:4201');
    socket.on('connect', socketConnect);
    socket.on('update', function(data){updateReceived(socket,data)});
    socket.on('assignPlayer',  assignPLayer);
    socket.on('disconnect', function(){aviso.text = "disconnect";});
    
    
    // Se configuran las teclas a usar en el juego
    this.leftKey = game.input.keyboard.addKey(Phaser.Keyboard.LEFT);
	this.rightKey = game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);
	this.upKey = game.input.keyboard.addKey(Phaser.Keyboard.UP);
	this.downKey = game.input.keyboard.addKey(Phaser.Keyboard.DOWN);
	this.spaceKey = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    game.input.keyboard.addKeyCapture([ Phaser.Keyboard.LEFT, Phaser.Keyboard.RIGHT, Phaser.Keyboard.UP, Phaser.Keyboard.DOWN, Phaser.Keyboard.SPACEBAR ]);
}


function socketConnect(){
     aviso.text = "Socket.io connect";
}
//------------------------------------------------------------------
//     assignPlayer
//------------------------------------------------------------------
function assignPLayer(playerIn){
    var founded =findGameObjectByUID (playerIn.uid);
    if (founded === false){
        player =  game.add.sprite(playerIn.x, playerIn.y, playerIn.type);
        player.remoteObject = playerIn;
        gameObjects.push(player);
    }
    else {
        player = founded;
    }
    player.addChild(game.make.text(10  ,90,playerIn.label,{ font: "20px Arial", fill: "#FF0000" }));
}


//-----------------------------------------------------
//   UPDATE RECEIVED
//-----------------------------------------------------
function updateReceived(socket , gameObjectsReceived){

     updatingStatus = 0;
     console.log("updateReceived");
     aviso.text = "updateReceived";
     
     for(i = 0 ; i < gameObjectsReceived.length ; i++){
          obj = gameObjectsReceived[i];
          //console.log("    UID:"+obj.uid+" type:"+obj.type+" x:"+obj.x+" y:"+obj.y);
     }
     for (i = 0 ; i < gameObjects.length ; i++){
         gameObjects[i].markForDelete = true;
     }
     for(i = 0 ; i < gameObjectsReceived.length ; i++){
          var ro = gameObjectsReceived[i];
          var founded =findGameObjectByUID (ro.uid);          
          
          if (founded === false){
              //console.log("NOT founded uid: "+ro.uid+" type:"+ro.type+" x:"+ro.x+" y:"+ro.y);
              var sprite = game.add.sprite(ro.x, ro.y, ro.type);
              if (ro.label){
                  sprite.addChild(game.make.text(10  ,90,ro.label,{ font: "15px Arial", fill: "#FFFFFF" }));
              }
              sprite.remoteObject = ro;
              sprite.markForDelete = false;
              gameObjects.push(sprite);
          }
          else {
              //console.log("YES founded uid: "+ro.uid+" type:"+ro.type+" x:"+ro.x+" y:"+ro.y);
              founded.x = ro.x;
              founded.y = ro.y;
              if (founded.remoteObject.type.muerto){
                  founded.addChild(game.make.text(10  ,90,'MUERTO',{ font: "15px Arial", fill: "#FFFFFF" }));
              }
              founded.markForDelete = false;
              var demoTween = game.add.tween(founded).to({x:ro.x,y:ro.y},50);
              demoTween.start();
          }          
     }
     for (i = 0 ; i < gameObjects.length ; i++){
         if (gameObjects[i].markForDelete){
             gameObjects[i].kill();
             gameObjects.splice(i,1);
             i--;
         }
     } 
}

function findGameObjectByUID(uid){
    console.log("findGameObjectById "+uid);
    for(i = 0 ; i < gameObjects.length ; i++){
        obj = gameObjects[i];
        if (obj.remoteObject.uid == uid){
            return obj;
        }
    }
    return false;
}
//======================================================
//        C R E A T E
//======================================================
function update() {
     if (socket != null && updatingStatus == 0){
         updatingStatus =1;
         socket.emit('update', ticks);
     }
     if (this.leftKey.isDown){
         socket.emit('keyDown', 'left');
     }
     if (this.rightKey.isDown){
         socket.emit('keyDown', 'right');
     }
     if (this.upKey.isDown){
         socket.emit('keyDown', 'up');
     }
     if (this.downKey.isDown){
         socket.emit('keyDown', 'down');
     }
     if (this.spaceKey.isDown){
         socket.emit('keyDown', 'space');
     }
}

function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}


