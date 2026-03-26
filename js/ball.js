// js/ball.js
class Ball {
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.speed = 0;
        this.velocityX = 0;
        this.velocityY = 0;
        this.isHeld = true; // Si está en manos del Malo
    }

    draw(ctx) {
        if (!this.isHeld) {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Método para lanzar la pelota
    throw(directionX, directionY, throwForce) {
        this.isHeld = false;
        this.velocityX = directionX * throwForce;
        this.velocityY = directionY * throwForce;
    }

    update() {
        if (!this.isHeld) {
            this.x += this.velocityX;
            this.y += this.velocityY;

            // Aquí iría la lógica de rebote en los bordes del octágono
            // y la reducción de velocidad por fricción.
            // Por ahora, solo la movemos.
        }
    }

    // Método para ser recogida por el Malo
    pickup(x, y) {
        this.x = x;
        this.y = y;
        this.isHeld = true;
        this.velocityX = 0;
        this.velocityY = 0;
    }
}
