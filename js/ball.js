// js/ball.js
class Ball {
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocityX = 0;
        this.velocityY = 0;
        this.isHeld = true; // Si está en manos del Malo
        this.maxSpeed = 15; // Velocidad máxima de lanzamiento
        this.friction = 0.98; // Factor de fricción
    }

    draw(ctx) {
        if (!this.isHeld) {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    throw(directionX, directionY, throwForce) {
        this.isHeld = false;
        // Normalizar la dirección y aplicar fuerza
        const magnitude = Math.sqrt(directionX**2 + directionY**2);
        if (magnitude > 0) {
            this.velocityX = (directionX / magnitude) * throwForce * this.maxSpeed;
            this.velocityY = (directionY / magnitude) * throwForce * this.maxSpeed;
        }
    }

    update(canvasWidth, canvasHeight, players, madrinas) {
        if (!this.isHeld) {
            this.x += this.velocityX;
            this.y += this.velocityY;

            // Aplicar fricción
            this.velocityX *= this.friction;
            this.velocityY *= this.friction;

            // Detener si la velocidad es muy baja
            if (Math.abs(this.velocityX) < 0.1) this.velocityX = 0;
            if (Math.abs(this.velocityY) < 0.1) this.velocityY = 0;
            if (this.velocityX === 0 && this.velocityY === 0) {
                 // Podríamos hacer que el Malo pueda recogerla automáticamente si está cerca
            }

            // Rebotar en los bordes del canvas (simplificado)
            if (this.x - this.radius < 0 || this.x + this.radius > canvasWidth) {
                this.velocityX *= -0.8; // Rebote con pérdida de energía
                this.x = Math.max(this.radius, Math.min(canvasWidth - this.radius, this.x));
            }
            if (this.y - this.radius < 0 || this.y + this.radius > canvasHeight) {
                this.velocityY *= -0.8;
                this.y = Math.max(this.radius, Math.min(canvasHeight - this.radius, this.y));
            }

            // TODO: Implementar rebote en los bordes del octágono si es necesario
        }
    }

    pickup(x, y) {
        this.x = x;
        this.y = y;
        this.isHeld = true;
        this.velocityX = 0;
        this.velocityY = 0;
    }

    // Método para verificar si la pelota golpeó a un jugador
    checkHit(player) {
        if (!this.isHeld && !player.isMalo && !player.isInvincible && !player.isEliminated) {
            const collision = utils.checkCircleCollision(this, player);
            if (collision) {
                // La pelota golpeó al jugador
                return true;
            }
        }
        return false;
    }
}
