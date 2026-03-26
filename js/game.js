// js/game.js

// --- Constantes del Juego ---
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const MADRINA_RADIUS = 25;
const NUM_MADRINAS = 8;
const MADRINA_VALUES = [150, 200, 250, 300, 350, 400, 450, 500];
const BALL_RADIUS = 12;
const PLAYER_SPEED = 4;
const THROW_FORCE = 1.2; // Factor de fuerza del lanzamiento
const INVINCIBILITY_DURATION = 3000; // 3 segundos
const HIT_EFFECT_DURATION = 1000; // 1 segundo para mostrar la X

// --- Variables Globales del Juego ---
let canvas;
let ctx;
let gameObjects = []; // Array para todos los elementos del juego
let players = [];
let ball;
let madrinas = [];
let gameMode = 'waiting'; // 'waiting', 'playing', 'gameOver'
let maloPlayer = null;
let score = 0;
let lastTime = 0;
let keys = {}; // Objeto para rastrear teclas presionadas

// --- Inicialización ---
window.onload = () => {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    setupGame();
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    requestAnimationFrame(gameLoop);
};

function setupGame() {
    // 1. Crear Madrinas (en forma de octágono)
    const centerX = CANVAS_WIDTH / 2;
    const centerY = CANVAS_HEIGHT / 2;
    const outerRadius = Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) * 0.4; // Radio del octágono

    for (let i = 0; i < NUM_MADRINAS; i++) {
        const angle = (360 / NUM_MADRINAS) * i;
        const pos = utils.getPointOnCircle(centerX, centerY, outerRadius, angle);
        madrinas.push({
            id: i,
            x: pos.x,
            y: pos.y,
            radius: MADRINA_RADIUS,
            value: MADRINA_VALUES[i],
            color: '#FFD700', // Color dorado para las madrinas
            isTarget: false // Para resaltar la madrina activa
        });
    }

    // 2. Crear Jugadores (asumiendo 2 jugadores + IA)
    // Jugador 1 (Controlado por teclado)
    players.push(new Nino(1, centerX - 150, centerY, PLAYER_COLOR_GOOD)); // Niño 1
    // Jugador 2 (Controlado por teclado)
    players.push(new Nino(2, centerX - 50, centerY, PLAYER_COLOR_GOOD)); // Niño 2
    // IA Jugador 3
    players.push(new Nino(3, centerX + 50, centerY, PLAYER_COLOR_GOOD)); // Niño 3 (IA)
    // IA Jugador 4
    players.push(new Nino(4, centerX + 150, centerY, PLAYER_COLOR_GOOD)); // Niño 4 (IA)

    // 3. Crear la Pelota
    // La pelota se inicializa en la mano del Malo
    const initialMaloX = centerX;
    const initialMaloY = centerY + 100;
    maloPlayer = new Malo(0, initialMaloX, initialMaloY); // Malo 0
    ball = new Ball(initialMaloX, initialMaloY, BALL_RADIUS, '#FF6347'); // Tomate
    maloPlayer.pickupBall(ball); // El Malo coge la pelota al inicio
    players.push(maloPlayer);

    // Asignar madrinas a los niños secuencialmente
    players.forEach((player, index) => {
        if (!player.isMalo) {
            player.setMadrina(madrinas[player.currentMadrinaIndex]);
        }
    });

    // Añadir todos los objetos al array principal
    gameObjects.push(...madrinas, ...players);
    gameObjects.push(ball); // La pelota también es un objeto a actualizar/dibujar

    // Inicializar la IA
    ai = new AI({ players: players, madrinas: madrinas, ball: ball, gameCanvas: canvas });

    // Mostrar información inicial
    updateScoreDisplay();
}

function updateScoreDisplay() {
    const scoreDisplay = document.getElementById('score-display');
    scoreDisplay.innerHTML = `Vidas: ${players.filter(p => !p.isMalo).map(p => `Niño ${p.id}: ${p.lives}`).join(' | ')} | ${maloPlayer ? 'Malo Vidas: N/A' : ''}`;
}

// --- Manejo de Teclado ---
function handleKeyDown(e) {
    keys[e.code] = true;
    // Iniciar sorteo con Espacio
    if (e.code === 'Space' && gameMode === 'waiting') {
        startGame();
    }
}

function handleKeyUp(e) {
    keys[e.code] = false;
}

function startGame() {
    gameMode = 'playing';
    document.getElementById('score-display').textContent = "¡El juego ha comenzado! ¡Corre!";
    // Aquí podríamos resetear vidas, posiciones, etc. si fuera necesario
}

// --- Bucle Principal del Juego ---
function gameLoop(currentTime) {
    const deltaTime = (currentTime - lastTime) / 1000; // Delta time en segundos
    lastTime = currentTime;

    // Limpiar canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Dibujar fondo (opcional)
    drawBackground();

    // Actualizar y dibujar todos los objetos
    gameObjects.forEach(obj => {
        if (obj.update) obj.update(deltaTime, CANVAS_WIDTH, CANVAS_HEIGHT); // Pasar deltaTime si es necesario
        if (obj.draw) obj.draw(ctx);
    });

    // Lógica específica del juego si está en modo 'playing'
    if (gameMode === 'playing') {
        handlePlayerMovement(deltaTime);
        handleBallLogic();
        handleCollisions();
        ai.update(deltaTime); // Actualizar IA
        updateGameStatus(); // Verificar si el juego ha terminado
    } else if (gameMode === 'waiting') {
        // Mostrar mensaje de "Presiona Espacio para empezar"
        ctx.fillStyle = 'white';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Presiona ESPACIO para iniciar el sorteo y el juego', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
    } else if (gameMode === 'gameOver') {
         ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
         ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
         ctx.fillStyle = 'white';
         ctx.font = '36px Arial';
         ctx.textAlign = 'center';
         ctx.fillText('¡Juego Terminado!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
         ctx.font = '24px Arial';
         ctx
