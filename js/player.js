// js/player.js

// --- Constantes de Jugador ---
const PLAYER_RADIUS = 15; // Radio de los personajes
const PLAYER_COLOR_BAD = '#FF4500'; // Naranja rojizo para el Malo
const PLAYER_COLOR_GOOD = '#1E90FF'; // Azul para los Niños
const MAX_LIVES = 3;
const INVINCIBILITY_DURATION = 3000; // 3 segundos en milisegundos
const HIT_EFFECT_DURATION = 1000; // 1 segundo para mostrar la X

class Player {
    constructor(id, x, y, color, isMalo = false) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.radius = PLAYER_RADIUS;
        this.color = color;
        this.isMalo = isMalo;
        this.lives = MAX_LIVES;
        this.isInvincible = false;
        this.invincibleTimer = 0;
        this.isHit = false;
        this.hitEffectTimer = 0;
        this.baseX = x; // Posición base para volver
        this.baseY = y;
        this.isEliminated = false;
        this.state = 'idle'; // 'idle', 'running', 'returning', 'protected', 'chasing_ball', 'wandering', 'finished', 'eliminated'
        this.speed = PLAYER_SPEED; // Velocidad de movimiento
        this.currentMadrinaIndex = 0; // Índice de la madrina a la que se dirige
        this.targetMadrina = null; // Objeto madrina objetivo
        this.ball = null; // Referencia a la pelota si la tiene
    }

    draw(ctx) {
        if (this.isEliminated) return;

        // Dibujar el personaje
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Dibujar el halo de invencibilidad
        if (this.isInvincible) {
            ctx.strokeStyle = 'rgba(0, 255, 0, 0.7)'; // Halo verde semitransparente
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 5, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Dibujar "X" si ha sido golpeado recientemente
        if (this.isHit) {
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 3;
            const size = this.radius * 1.2;
            ctx.beginPath();
            ctx.moveTo(this.x - size / 2, this.y - size / 2);
            ctx.lineTo(this.x + size / 2, this.y + size / 2);
            ctx.moveTo(this.x - size / 2, this.y + size / 2);
            ctx.lineTo(this.x + size / 2, this.y - size / 2);
            ctx.stroke();
        }

        // Dibujar el nombre/id del jugador
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.isMalo ? 'Malo' : `Niño ${this.id}`, this.x, this.y - this.radius - 10);

        // Dibujar la pelota si el Malo la tiene
        if (this.isMalo && this.ball && this.ball.isHeld) {
            this.ball.draw(ctx); // Dibuja la pelota en la mano del malo
        }
    }

    update(deltaTime, canvasWidth, canvasHeight) {
        // Actualizar temporizadores
        if (this.isInvincible) {
            this.invincibleTimer += deltaTime;
            if (this.invincibleTimer >= INVINCIBILITY_DURATION) {
                this.isInvincible = false;
                this.invincibleTimer = 0;
            }
        }
        if (this.isHit) {
            this.hitEffectTimer += deltaTime;
            if (this.hitEffectTimer >= HIT_EFFECT_DURATION) {
                this.isHit = false;
                this.hitEffectTimer = 0;
            }
        }

        // Lógica de movimiento (se maneja principalmente en game.js y ai.js)
        // Aquí solo actualizamos la posición si el estado lo requiere,
        // pero el movimiento real se calcula externamente.
    }

    moveTowards(targetX, targetY, speed) {
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > speed) { // Si la distancia es mayor que la velocidad, moverse
            this.x += (dx / distance) * speed;
            this.y += (dy / distance) * speed;
        } else { // Si está cerca, moverse directamente a la posición
            this.x = targetX;
            this.y = targetY;
        }
    }

    // Método para que el Malo recoja la pelota
    pickupBall(ball) {
        if (this.isMalo) {
            this.ball = ball; // Asignar la pelota al Malo
            ball.pickup(this.x, this.y); // Poner la pelota en la posición del Malo
        }
    }

    // Método para que el Malo lance la pelota
    throwBall(directionX, directionY, force) {
        if (this.isMalo && this.ball) {
            const thrown = this.ball.throw(directionX, directionY, force);
            this.ball = null; // El Malo suelta la pelota
            return thrown; // Devuelve si el lanzamiento fue exitoso
        }
        return false;
    }

    // Método para que un Niño toque una madrina
    touchMadrina(madrina) {
        if (!this.isMalo && !this.isEliminated && madrina) {
            this.setMadrina(madrina); // Asignar la nueva madrina objetivo
        }
    }

    // Asignar una madrina como objetivo
    setMadrina(madrina) {
        this.targetMadrina = madrina;
        this.state = 'running_to_madrina'; // Cambiar estado a correr hacia la madrina
    }

    // Método para ser golpeado por la pelota
    getHit() {
        if (!this.isMalo && !this.isInvincible && !this.isEliminated) {
            this.lives--;
            this.isHit = true;
            this.hitEffectTimer = 0; // Reiniciar temporizador de efecto
            if (this.lives <= 0) {
                this.isEliminated = true;
                this.state = 'eliminated';
                console.log(`Niño ${this.id} ha sido eliminado.`);
            } else {
                this.isInvincible = true; // Volverse invencible temporalmente
                this.invincibleTimer = 0;
                console.log(`Niño ${this.id} golpeado. Vidas restantes: ${this.lives}`);
            }
            return true; // Devuelve true si fue golpeado y perdió vida
        }
        return false; // Devuelve false si no fue golpeado (invencible, malo, eliminado)
    }
}

// Clase específica para el Malo (hereda de Player)
class Malo extends Player {
    constructor(id, x, y) {
        super(id, x, y, PLAYER_COLOR_BAD, true); // Es malo, color específico
        this.speed = PLAYER_SPEED * 1.2; // El Malo es un poco más rápido
        this.state = 'wandering'; // Estado inicial del Malo
    }

    // El Malo no tiene vidas en el mismo sentido que los niños,
    // su derrota podría ser diferente (ej: si la pelota llega a su base)
    // Por ahora, no implementamos lógica de vidas para el Malo.
}

// Clase específica para los Niños (hereda de Player)
class Nino extends Player {
    constructor(id, x, y, color) {
