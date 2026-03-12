let canvas = document.querySelector("canvas");

let ctx = canvas.getContext("2d");


canvas.height = window.innerHeight;
canvas.width = window.innerWidth;

canvas.style.background = "#3f3f3f";

const speed = 5;

let mouse = {};
let game = {};

class Player {
    constructor(x, y, length) {
        this.x = x
        this.y = y
        this.length = length
        this.velocity = {
            x: 0,
            y: 0
        }
        this.direction = {
            up: false,
            down: false,
            right: false,
            left: false
        }
        this.blockedDirections = {
            up: false,
            down: false,
            right: false,
            left: false
        }
        this.muzzle = {
            x: this.x+this.length/2,
            y: this.y+this.length/2

        }
    }
    update() {
        this.velocity.x = 0;
        this.velocity.y = 0;
        if (this.direction.up && !this.blockedDirections.up) { // race condition fix 
            this.velocity.y -= speed;
        }
        if (this.direction.down && !this.blockedDirections.down) {
            this.velocity.y += speed;
        }
        if (this.direction.right && !this.blockedDirections.right) {
            this.velocity.x += speed;
        }
        if (this.direction.left && !this.blockedDirections.left) {
            this.velocity.x -= speed;
        }
        if (this.velocity.x != 0 && this.velocity.y != 0) {
            this.x += this.velocity.x * Math.SQRT1_2 // diagonal movement fix 
            this.y += this.velocity.y * Math.SQRT1_2
        } else {
            this.x += this.velocity.x
            this.y += this.velocity.y
        }

        // unblock all
        this.blockedDirections = {
            up: false,
            down: false,
            right: false,
            left: false
        }
        this.muzzle = {
            x: this.x+this.length/2,
            y: this.y+this.length/2

        }
    }

    draw() {
        ctx.beginPath()
        ctx.fillStyle = "#2c98f1ff"
        ctx.fillRect(this.x, this.y, this.length, this.length)
        ctx.closePath()
    }
}

class Bullet{
    constructor(x,y,targetx,targety){
        this.x = x;
        this.y = y;
        let angle = Math.atan2(targetx - this.x,targety - this.y)
        this.velocity = {
            x : 10 * Math.sin(angle),
            y : 10 * Math.cos(angle),
        } 
        console.log(this.velocity)
    }

    update(){
        this.x += this.velocity.x
        this.y += this.velocity.y
        
    }
    draw(){
        ctx.beginPath()
        ctx.fillStyle = "#ff9904"
        // ctx.fillRect(this.x, this.y, 5, 5)
        ctx.strokeStyle = "#ff9904"
        ctx.arc(this.x, this.y, 4, 0,Math.PI * 2 , false )
        ctx.fill()
        ctx.closePath()
    }
}

class Wall {
    constructor(x, y, length) {
        this.x = x;
        this.y = y;
        this.length = length;
    }
    detectCollisions(object) {
        // detect for collisions 
        if (this.x < object.x + object.length &&
            this.x + this.length > object.x &&
            this.y < object.y + object.length &&
            this.y + this.length > object.y) {

            let overlaps = { // check for overlap distances from all direction
                top: object.y + object.length - this.y,
                bottom: this.y + this.length - object.y,
                right: this.x + this.length - object.x,
                left: object.x + object.length - this.x
            }

            let minX = Math.min(overlaps.left, overlaps.right)
            let minY = Math.min(overlaps.top, overlaps.bottom)

            if (minX < minY) {
                if (overlaps.left < overlaps.right) {
                    object.x = this.x - object.length;
                    object.blockedDirections.right = true;
                } else {
                    object.x = this.x + this.length;
                    object.blockedDirections.left = true;
                }
            } else {
                if (overlaps.top < overlaps.bottom) {
                    object.y = this.y - object.length;
                    object.blockedDirections.bottom = true;
                } else {
                    object.y = this.y + this.length;
                    object.blockedDirections.top = true;
                }

            }


        }

    }
    draw() {
        ctx.beginPath()
        ctx.fillStyle = "#ff69b4"
        ctx.fillRect(this.x, this.y, this.length, this.length)
        ctx.closePath()
    }
}

class Enemy {
    constructor(x,y,length){
        
        this.x = x
        this.y = y
        this.length = length
        this.velocity = {
            x: 0,
            y: 0
        }
        this.speed = (speed / 2) * Math.random()+1;
    }
    update(){
        // TODO add distance calulation with pythagor
        let angle = Math.atan2(game.player.x - this.x,game.player.y - this.y);
        
        this.velocity.x = this.speed * Math.sin(angle)
        this.velocity.y = this.speed * Math.cos(angle)

        this.x += this.velocity.x;
        this.y += this.velocity.y;

    }
    draw(){
        ctx.beginPath()
        ctx.fillStyle = "#22ff90" 
        ctx.fillRect(this.x,this.y,this.length,this.length);
    }
}



function initGame() {

    // example input map
    game.map = [
        [0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0],
        [0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0],
        [0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0],
        [0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0],
        [0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0],
        [0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0],
        [0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0],
        [0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0],
        [0, 0, 0, 0, 1, 1, 0, 1, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 1, 1, 1],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 1, 1, 0, 1, 0, 0, 0, 1, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 0, 1, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 1, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 1, 1, 0, 1, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 1, 1, 0, 1, 0, 0],
        [0, 1, 1, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 1, 0, 0, 1, 1, 0, 0, 0],
        [0, 0, 0, 1, 1, 0, 1, 1, 1, 0],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ]
    /*
    let rows = parseInt(canvas.height / 30) // 30 is the wall block size 
    let cols = parseInt(canvas.width / 30) // 30 is the wall block size 
    let map = []
    for(let i =0;i<rows;i++){
        let row = []
        for(let j=0;j<cols;j++){
            let val = Math.round(Math.random())
            row.push(val);
        }
        map.push(row)

    } 
    */




    // example wall generation
    game.walls = []
    for (let i = 0; i < game.map.length; i++) {
        for (let j = 0; j < game.map[i].length; j++) {
            if (game.map[i][j] == 1) {
                // TODO : 30 is wall size make global variable
                // TODO : make the walls support rectangular shape with parameters 
                //        (x,y,width,height) instead of just length
                game.walls[game.walls.length] = new Wall(j * 30, i * 30, 30);
            }
        }
    }

    game.player = new Player(10, 10, 30)
    game.bullets = []
    game.enemies = []
    game.enemies[0] = new Enemy(400,400,30)
    game.enemies[1] = new Enemy(600,200,30)
    game.enemies[2] = new Enemy(200,600,30)
    game.enemies[3] = new Enemy(700,400,30)

}
function animate() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);

    game.player.update();

    //render the walls and calculate collisions
    for (let i = 0; i < game.walls.length; i++) {
        game.walls[i].detectCollisions(game.player)
        game.walls[i].draw()
    }

    game.player.draw();

    for(let i=0;i<game.enemies.length;i++){
        game.enemies[i].update()
        game.enemies[i].draw()
    }


    for(let i = 0;i<game.bullets.length;i++){
        game.bullets[i].update()
        game.bullets[i].draw()
    }

    requestAnimationFrame(animate)
}

initGame()

animate()
// controls setup
document.addEventListener("keydown", e => {
    if (e.key == 'w') game.player.direction.up = true;
    if (e.key == 's') game.player.direction.down = true;
    if (e.key == 'a') game.player.direction.left = true;
    if (e.key == 'd') game.player.direction.right = true;
})

document.addEventListener("keyup", e => {
    if (e.key == 'w') game.player.direction.up = false;
    if (e.key == 's') game.player.direction.down = false;
    if (e.key == 'a') game.player.direction.left = false;
    if (e.key == 'd') game.player.direction.right = false;
})

document.addEventListener("mousemove", e => {
    mouse.x = e.x
    mouse.y = e.y
})

document.addEventListener("click",()=>{
    game.bullets.push(new Bullet(
        game.player.muzzle.x,
        game.player.muzzle.y,
        mouse.x,
        mouse.y
    ))
})
