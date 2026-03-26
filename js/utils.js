// js/utils.js
const utils = {
    distance: (x1, y1, x2, y2) => {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    },
    // Añadimos una función simple para obtener un punto en un círculo
    getPointOnCircle: (centerX, centerY, radius, angleInDegrees) => {
        const angleInRadians = (angleInDegrees - 90) * Math.PI / 180; // -90 para que 0 grados sea arriba
        const x = centerX + (radius * Math.cos(angleInRadians));
        const y = centerY + (radius * Math.sin(angleInRadians));
        return { x, y };
    },
    // Colisión simple entre dos círculos
    checkCircleCollision: (c1, c2) => {
        const distSq = (c1.x - c2.x)**2 + (c1.y - c2.y)**2;
        const radiusSum = c1.radius + c2.radius;
        return distSq <= radiusSum**2;
    }
};
