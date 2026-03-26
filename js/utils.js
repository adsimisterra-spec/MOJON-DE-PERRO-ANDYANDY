// js/utils.js
const utils = {
    distance: (x1, y1, x2, y2) => {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    },
    // Podríamos añadir funciones para colisiones circulares/rectangulares aquí
    // ...
};
