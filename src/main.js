import { Game } from "../lib/game.js";
import { updateInput, isActionJustPressed } from "../lib/input.js";
import { Vector2, randomFloat, randomInt } from "../lib/math.js";
import { RectangleCollisionShape2D, checkCollision } from "../lib/physics.js";
import { Emitter, Particle } from "../lib/particle2.js";
import { jumpConfig, explodeConfig, bgConfig } from "./particleconfigs.js";
import { AudioStream } from "../lib/audio.js";

Game.createWindow(136, 204, 3);
Game.addLayer("main", 1, false);
Game.addLayer("text", 2, false);

let layers = Game.layers;

let urls = {
    start1: "./src/assets/sprites/start1.png",
    start2: "./src/assets/sprites/start2.png",
    over1: "./src/assets/sprites/over1.png",
    over2: "./src/assets/sprites/over2.png",
    bg1: "./src/assets/sprites/bg1.png",
    bird: "./src/assets/sprites/bird.png",
    pipe1: "./src/assets/sprites/pipe1.png",
};

// Import image files to be used as textures in game;
await Game.preloadAll(urls)
let textures = Game.textures;

let sfxJump = new AudioStream("./src/assets/sounds/jump1.wav");
let sfxExplode = new AudioStream("./src/assets/sounds/explode1.wav");
let sfxUI = new AudioStream("./src/assets/sounds/ui1.wav");

let emitterJump = new Emitter();
let emitterExplode = new Emitter();
let emitterBG = new Emitter();
let particlePool = [];
let bgParticlePool = [];
for (let i = 0; i < 50; i++) {
    particlePool.push(new Particle())
    bgParticlePool.push(new Particle())
}


class Bird {
    constructor(texture, x, y) {
        this.dead = false;
        this.texture = texture;
        this.frameWidth = 20;
        this.frameHeight = 20;

        this.x = x;
        this.y = y;
        this.vely = 0;
        this.gravity = 400;
        this.jumpForce = -120;
        
        // Offsets will help align the collider with the texture;
        this.collider = new RectangleCollisionShape2D(this.x, this.y, 10, 10);
        this.collierOffsetX = 5;
        this.collierOffsetY = 4;

        this.currentFrame = 0;
        this.maxFrames = 4;
        this.animDuration = 100;
        this.fps = 1000 / this.animDuration;
        this.animName = "fly";
        this.deadAnimFinished = false;
    }

    update(deltaTime) {
        this.vely += this.gravity * deltaTime;
        this.y += this.vely * deltaTime;
        this.collider.updatePosition(new Vector2(this.x + this.collierOffsetX, this.y + this.collierOffsetY));

        // Out of screen;
        if (this.y < -this.frameHeight || this.y > Game.height) {
            this.dead = true;
        }
    }

    startDeadAnim() {
        if (this.animName !== "dead") {
            this.currentFrame = 0;
            this.maxFrames = 4;
            this.deadAnimFinished = false;

            this.animName = "dead";

            emitterExplode.start();
            sfxExplode.play(0.3);
            startScreenShake(3, 100);
        }
    }

    animate(deltaTime) {
        emitterExplode.update(deltaTime, this.x + 10, this.y + 10, explodeConfig, particlePool);

        this.currentFrame += deltaTime * this.fps;

        // Animation is finished, if not dead loop it;
        if (this.currentFrame >= this.maxFrames) {
            if (this.animName === "dead") {
                this.deadAnimFinished = true;
            } else {
                this.currentFrame = 0;
            }
        }
    }

    jump() {
        this.vely = this.jumpForce;

        emitterJump.start();
        sfxJump.play(1);
    }

    draw(ctx) {
        // Draw explosion frames;
        if (this.animName === "dead") {
            ctx.drawImage(this.texture, 
                (Math.floor(this.currentFrame) + 4) * this.frameWidth, 0, 
                this.frameWidth, this.frameHeight,
                this.x, this.y, this.frameWidth, this.frameHeight);

            return;
        }

        // Draw flying frames;
        ctx.drawImage(this.texture, 
            Math.floor(this.currentFrame) * 20, 0, 
            this.frameWidth, this.frameHeight,
            this.x, this.y, this.frameWidth, this.frameHeight);
        // this.collider.draw(ctx);
    }
}

class Pipe {
    constructor(texture, x, y) {
        this.active = false;
        this.texture = texture;
        this.x = x;
        this.y = y;
        this.width = 28;
        this.pipeSpeed = 60;

        // Offsets will help align the colliders with the texture;
        this.collider1 = new RectangleCollisionShape2D(this.x, this.y, 24, 200);
        this.collider2 = new RectangleCollisionShape2D(this.x, this.y, 24, 200);
        this.offsetX = 39;
        this.offsetY1 = -48;
        this.offsetY2 = 200;
    }

    respawn() {
        this.active = true;

        this.x = Game.width + 20;
        this.y = randomInt(-130, -20);
    }

    update(deltaTime) {
        if (!this.active) {
            return;
        }

        this.x -= Math.round(this.pipeSpeed * deltaTime);

        this.collider1.updatePosition(new Vector2(this.x + this.offsetX, this.y + this.offsetY1));
        this.collider2.updatePosition(new Vector2(this.x + this.offsetX, this.y + this.offsetY2));

        // Out of screen;
        if (this.x < -this.width - this.offsetX - 24) {
            this.active = false;
            increaseScore();
        }
    }

    draw(ctx) {
        ctx.drawImage(this.texture, this.x, this.y);
        // this.collider1.draw(ctx);
        // this.collider2.draw(ctx);
    }
}

let bird;
let pipes = [];
let score = 0;

let pipeLastSpawnTime = performance.now();
let pipeSpawnInterval = 1400;

// Will be used for parallax;
let bgOffsetX = 0;

function init() {
    bird = new Bird(textures.bird, 36, 95);
    pipes = [];
    score = 0;

    // Create 3 pipe instances and recicle them when inactive;
    pipes.push(new Pipe(textures.pipe1, Game.width + 20, randomInt(-130, -20)));
    pipes.push(new Pipe(textures.pipe1, Game.width + 20, randomInt(-130, -20)));
    pipes.push(new Pipe(textures.pipe1, Game.width + 20, randomInt(-130, -20)));

    // Reset parallax;
    bgOffsetX = 0;

    emitterBG.start();
}
function increaseScore() {
    score += 1;
}
function update(deltaTime) {
    if (bird.deadAnimFinished && !emitterExplode.active) {
        sleep(1000, () => { Game.setGameState("gameover"); });
    }

    // Stop everything else while death animations and particles are playing
    if (bird.dead) {
        bird.startDeadAnim();
        bird.animate(deltaTime);
        return;
    }

    if (isActionJustPressed("jump")) { bird.jump(); }
    bird.update(deltaTime);
    bird.animate(deltaTime);

    emitterJump.update(deltaTime, bird.x + 10, bird.y + 20, jumpConfig, particlePool);
    emitterBG.update(deltaTime, Game.width, 0, bgConfig, bgParticlePool);

    for (const pipe of pipes) {
        pipe.update(deltaTime);
        
        if (checkCollision(pipe.collider1, bird.collider) || checkCollision(pipe.collider2, bird.collider)) {
            bird.dead = true;
        }
    }
   
    // Spawn any inactive pipes from time to time;
    let currentTime = performance.now();
    let elapsedTime = currentTime - pipeLastSpawnTime;
    if (elapsedTime > pipeSpawnInterval) {
        for (const pipe of pipes) {
            if (!pipe.active) {
                pipe.respawn();
                break;
            }
        }

        pipeLastSpawnTime = currentTime;
    }

    // Parallax
    bgOffsetX += 0.2;
}

//
// Draw
//
function draw() {
    layers.main.clearRect(0, 0, Game.width, Game.height);

    // Parallax, scroll trough background texture, using the offset;
    layers.main.drawImage(textures.bg1, bgOffsetX % Game.width * 2, 0, Game.width, Game.height, 0, 0, Game.width, Game.height);
    
    bird.draw(layers.main);
    for (const pipe of pipes) { pipe.draw(layers.main); }

    emitterJump.draw(layers.main);
    emitterExplode.draw(layers.main);
    emitterBG.draw(layers.main);

    updateScreenShake();
}


function drawScore() {
    layers.text.clearRect(0, 0, Game.width, Game.height);
    layers.text.textAlign = "start";
    layers.text.font = "16px m6x11";
    layers.text.fillStyle = "#555568";
    layers.text.fillText(score, 6, 16);
    layers.text.fillStyle = "#a0a08b";
    layers.text.fillText(score, 6, 14);
}

let playButtomCollider = new RectangleCollisionShape2D(53,86,29,20);
let restartButtomCollider = new RectangleCollisionShape2D(40,86,56,19);
function drawStart() {
    layers.main.clearRect(0, 0, Game.width, Game.height);
    layers.text.clearRect(0, 0, Game.width, Game.height);

    layers.main.drawImage(textures.start1, 0, 0);

    if (checkCollision(Game.mousePos, playButtomCollider)) {
        layers.main.drawImage(textures.start2, 0, 0);

        if (isActionJustPressed("leftClick")) {
            sfxUI.play(1);
            Game.setGameState("run");
            init();
        }
    }
}
function drawGameOver() {
    layers.main.clearRect(0, 0, Game.width, Game.height);
    layers.text.clearRect(0, 0, Game.width, Game.height);

    layers.main.drawImage(textures.over1, 0, 0);


    if (checkCollision(Game.mousePos, restartButtomCollider)) {
        layers.main.drawImage(textures.over2, 0, 0);
        if (isActionJustPressed("leftClick")) {
            sfxUI.play(1);
            Game.setGameState("start");
        }
    }

    const scoreText = "Score:" + score;
    
    layers.text.textAlign = "center";
    layers.text.font = "16px monogram";
    layers.text.fillStyle = "#555568";
    layers.text.fillText(scoreText, Game.width/2, 82);
    layers.text.fillText(scoreText, Game.width/2, 81);
    layers.text.fillStyle = "#a0a08b";
    layers.text.fillText(scoreText, Game.width/2, 80);
}

// Gameloop
let lastTime = performance.now();
function gameLoop() {
    updateInput();

    let currentTime = performance.now();
    let deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    if (Game.state === "start") { drawStart(); }
    else if (Game.state === "gameover") { drawGameOver(); }
    else if (Game.state === "run") { 
        update(deltaTime);
        draw();
        drawScore();
    }
    
    requestAnimationFrame(gameLoop);
}

gameLoop();


let shakeIntensity = 0;
let shakeDuration = 0;
let shakeStartTime = 0;
let isScreenShaking = false;

function startScreenShake(intensity, duration) {
    if (!isScreenShaking) {
        isScreenShaking = true;
        shakeIntensity = intensity;
        shakeDuration = duration;
        shakeStartTime = performance.now();
    }
}
function updateScreenShake() {
    if (isScreenShaking) {
        let elapsed = performance.now() - shakeStartTime;
        if (elapsed < shakeDuration) {
            let shakeX = randomFloat(-shakeIntensity, shakeIntensity);
            let shakeY = randomFloat(-shakeIntensity, shakeIntensity);
            layers.main.setTransform(1, 0, 0, 1, shakeX, shakeY);
        } else {
            layers.main.setTransform(1, 0, 0, 1, 0, 0);
            isScreenShaking = false;
            shakeDuration = 0;
        }
    }
}

function sleep(ms, callback) {
    let currentTime = Date.now()
    while(currentTime + ms > Date.now()) {
        callback();
    }
}