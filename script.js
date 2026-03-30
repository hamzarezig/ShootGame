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
        this.alive = true
    }
    update() {
        // check for wall collisions
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
        this.length = 4
        //get direction
        let angle = Math.atan2(targetx - this.x,targety - this.y)
        this.velocity = {
            x : 10 * Math.sin(angle),
            y : 10 * Math.cos(angle),
        } 
        this.alive= true
    }

    update(){
        this.x += this.velocity.x
        this.y += this.velocity.y
        
        for(let i=0;i<game.enemies.length;i++){
            if(isColliding(this,game.enemies[i])) { // bullet hit
                game.enemies.splice(i,1)
                game.score.value++
                this.alive=false
            }
        }
        // wall detect
        let i = parseInt(this.y/30)
        let j = parseInt(this.x/30)
        if(game.map[i]!=undefined && game.map[i][j] == 1) {
            this.alive = false
        }
        

    }
    draw(){
        ctx.beginPath()
        ctx.fillStyle = "#ff9904"
        // ctx.fillRect(this.x, this.y, 5, 5)
        ctx.strokeStyle = "#ff9904"
        ctx.arc(this.x, this.y, this.length, 0,Math.PI * 2 , false )
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
    detectCollisions(objects) {
        // detect for collisions 
        for(const object of objects){

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
        this.blockedDirections = {
            up: false,
            down: false,
            right: false,
            left: false
        }
    }
    update(){
        // TODO add distance calulation with pythagor
        let angle = Math.atan2(game.player.x - this.x,game.player.y - this.y);
        
        this.velocity.x = this.speed * Math.sin(angle)
        this.velocity.y = this.speed * Math.cos(angle)

        if(
            (this.velocity.x > 0 && !this.blockedDirections.right) || 
            (this.velocity.x < 0 && !this.blockedDirections.left)
        ) this.x += this.velocity.x;
        if(
            (this.velocity.y > 0 && !this.blockedDirections.down) || 
            (this.velocity.y < 0 && !this.blockedDirections.left)
        ) this.y += this.velocity.y;

        this.blockedDirections = {
            up: false,
            down: false,
            right: false,
            left: false
        }
        if(isColliding(this,game.player)){
            game.player.alive = false
        }

    }
    draw(){
        ctx.beginPath()
        ctx.fillStyle = "#22ff90" 
        ctx.fillRect(this.x,this.y,this.length,this.length);
    }
}

class Score {
    constructor(x,y,value){
        this.x=x;
        this.y=y;
        this.value=value;
    }
    draw(){
        ctx.fillStyle = "#fefefe"
        ctx.font = "30px serif";
        ctx.fillText("Score : "+this.value, this.x, this.y);

    }
}

// functions 
function isColliding(obj1,obj2){
    return  obj1.x < obj2.x + obj2.length &&
            obj1.x + obj1.length > obj2.x &&
            obj1.y < obj2.y + obj2.length &&
            obj1.y + obj1.length > obj2.y ;

}

function generateEnemy(){
    let x = Math.floor(Math.random()*(canvas.width- 200) + 100 ) 
    let y = Math.floor(Math.random()*(canvas.height - 200) + 100 ) 
    game.enemies.push(new Enemy(x,y,30))
    setTimeout(generateEnemy,5000)
}

function initGame() {

    // example input map
    game.map = [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ]




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

    generateEnemy()
    game.score = new Score(canvas.width-150,40,0)

}
function animate() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);

    game.player.update();
    for(let i=0;i<game.enemies.length;i++){
        game.enemies[i].update()
    }

    //render the walls and calculate collisions
    for (let i = 0; i < game.walls.length; i++) {
        //game.walls[i].detectCollisions(game.player)
        game.walls[i].detectCollisions(game.enemies)
        game.walls[i].detectCollisions([game.player])
        game.walls[i].draw()
    }

    game.player.draw();

    for(let i=0;i<game.enemies.length;i++){
        game.enemies[i].draw()
    }


    for(let i = 0;i<game.bullets.length;i++){
        game.bullets[i].update()
        game.bullets[i].draw()
        if(!game.bullets[i].alive){
            //kill bullet
            game.bullets.splice(i,1)
        } 
    }
    game.score.draw()
    if(game.player.alive) requestAnimationFrame(animate)
    else gameover()
}
function gameover(){
    ctx.beginPath()
    ctx.fillStyle= "#f8f8f8"
    ctx.font = "100px serif";
    ctx.textAlign = "center"
    ctx.fillText("Game Over!",canvas.width/2,canvas.height/2)
    ctx.closePath()
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
