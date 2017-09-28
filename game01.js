var game = new Phaser.Game(1024, 768, Phaser.AUTO, 'game', { preload: preload, create: create, update: update });

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
var aviso = null;
var player = null;
var socket = null;
var updating = 0 ;
function create() {
    background = game.add.sprite(0, 0, 'background');
    aviso = game.add.text(10,10,"MENSAJES DEL SOCKET");
    player = game.add.sprite(0,0,'ship00');
    
    
    socket = io('http://127.0.0.1:4200');
    socket.on('connect', function(){aviso.text = "Conectado al Socket"} );
    socket.on('disconnect', function(){aviso.text = "Deconectado";});
    socket.on('playerUpdate', function(playerIn){ 
         player.x = playerIn.x; 
         player.y = playerIn.y;
         updating = 0;
         });
    
    
    
    this.leftKey = game.input.keyboard.addKey(Phaser.Keyboard.LEFT);
	this.rightKey = game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);
	this.upKey = game.input.keyboard.addKey(Phaser.Keyboard.UP);
	this.downKey = game.input.keyboard.addKey(Phaser.Keyboard.DOWN);
	this.spaceKey = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

    //  Stop the following keys from propagating up to the browser
    game.input.keyboard.addKeyCapture([ Phaser.Keyboard.LEFT, Phaser.Keyboard.RIGHT, Phaser.Keyboard.UP, Phaser.Keyboard.DOWN, Phaser.Keyboard.SPACEBAR ]);
 
}


function update(){

     if (updating == 0){
         socket.emit('update','');
         updating  =1;
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



