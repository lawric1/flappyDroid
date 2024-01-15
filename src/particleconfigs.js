import { Game } from "../lib/game.js";
import { randomInt } from "../lib/math.js";

let urls = {
    p1: "./src/assets/sprites/particle1.png",
    p2: "./src/assets/sprites/particle2.png",
    p3: "./src/assets/sprites/particle3.png",
};

await Game.preloadAll(urls)
let textures = Game.textures;


export const jumpConfig = {
    texture: textures.p1,
    maxFrames: 1,
    frameWidth: 8,
    frameHeight: 8,
    
    direction: { x: -1, y: 1 },
    velocity: 20,
    gravity: 0,
    spread: 90,
    
    scale: 1,
    minScale: 0.1,
    maxScale: 1,
    randomScale: true,
    
    angle: 90,
    angularVelocity: 90,
    randomAngle: true,
    
    lifetime: 0.1,

    emissionShape: { x: 0, y: 0 },
    oneshot: true,
    explosive: false,
    maxParticles: 10,
}
export const explodeConfig = {
    texture: textures.p2,
    maxFrames: 1,
    frameWidth: 8,
    frameHeight: 8,
    
    direction: { x: -1, y: 1 },
    velocity: 20,
    gravity: 50,
    spread: 360,
    
    scale: 1,
    minScale: 0.1,
    maxScale: 1,
    randomScale: true,
    
    angle: 90,
    angularVelocity: 90,
    randomAngle: true,
    
    lifetime: 0.6,

    emissionShape: { x: 0, y: 0 },
    oneshot: true,
    explosive: true,
    maxParticles: 10,
}
export const bgConfig = {
    texture: textures.p3,
    maxFrames: 1,
    frameWidth: 6,
    frameHeight: 5,
    
    direction: { x: -5, y: 1 },
    velocity: randomInt(20, 30),
    gravity: 0,
    spread: 0,
    
    scale: 1,
    minScale: 0.1,
    maxScale: 1,
    randomScale: true,
    
    angle: 90,
    angularVelocity: 90,
    randomAngle: true,
    
    lifetime: 6,

    emissionShape: { x: 20, y: 200 },
    oneshot: false,
    explosive: false,
    maxParticles: 50,
}