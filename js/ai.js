// js/ai.js

// --- Constantes de IA ---
const AI_CHASE_THRESHOLD = 50; // Distancia a la que la IA empieza a perseguir la pelota
const AI_THROW_THRESHOLD = 30; // Distancia a la que la IA intenta lanzar la pelota
const AI_RETURN_THRESHOLD = 100; // Distancia a la que la IA intenta volver a la madrina
const AI_EVADE_DISTANCE = 70; // Distancia para intentar evadir al malo
const AI_RUN_TO_MADRINA_DIST = 40; // Distancia para correr hacia la madrina

class AI {
    constructor(game) {
        this.game = game; // Referencia al objeto principal del juego
    }

    update(deltaTime) {
        const players = this.game.players;
        const madrinas = this.game.madrinas;
        const ball = this.game.ball;
        const malo = players.find(p => p.isMalo);

        if (!malo || !ball || !madrinas || players.length <= 1) return; // No hay suficientes elementos para la IA

        players.forEach(player => {
            // Solo procesar niños que no son el malo y no están eliminados
            if (player.isMalo || player.isEliminated) return;

            const currentMadrina = madrinas[player.currentMadrinaIndex];
            if (!currentMadrina) return; // Si ya pasó todas las madrinas

            const distToMalo = utils.distance(player.x, player.y, malo.x, malo.y);
            const distToBall = ball.isHeld ? Infinity : utils.distance(player.x, player.y, ball.x, ball.y);
            const distToMadrina = utils.distance(player.x, player.y, currentMadrina.x, currentMadrina.y);

            // --- Lógica de Estados de la IA ---

            // 1. Estado de Protección (Inmunidad activa)
            if (player.isInvincible) {
                player.state = 'protected';
                // Podría decidir si moverse o quedarse quieto mientras es invencible
                // Por ahora, simplemente espera a que termine la inmunidad
                return;
            }

            // 2. Estado de Eliminado
            if (player.isEliminated) {
                player.state = 'eliminated';
                return;
            }

            // 3. Estado de Persecución de Pelota (si el malo la tiene cerca)
            if (malo.ball && distToMalo < AI_CHASE_THRESHOLD) {
                player.state = 'chasing_ball';
                // Intentar evadir al malo si está muy cerca
                if (distToMalo < AI_EVADE_DISTANCE) {
                    // Moverse en dirección opuesta al malo
                    const angleToMalo = Math.atan2(malo.y - player.y, malo.x - player.x);
                    const evadeAngle = angleToMalo + Math.PI; // Dirección opuesta
                    player.x += Math.cos(evadeAngle) * player.speed * 1.5; // Moverse más rápido para evadir
                    player.y += Math.sin(evadeAngle) * player.speed * 1.5;
                } else {
                    // Moverse hacia la madrina si el malo tiene la pelota y está cerca
                    player.state = 'running_to_madrina';
                }
            }
            // 4. Estado de Persecución de Pelota (si la pelota está libre y cerca)
            else if (!ball.isHeld && distToBall < AI_CHASE_THRESHOLD) {
                player.state = 'chasing_ball';
                // Moverse hacia la pelota
                const angleToBall = Math.atan2(ball.y - player.y, ball.x - player.x);
                player.x += Math.cos(angleToBall) * player.speed;
                player.y += Math.sin(angleToBall) * player.speed;

                // Si está lo suficientemente cerca de la pelota libre, intentar recogerla (esto lo haría el Malo)
                // Para los niños, solo es persecución.
            }
            // 5. Estado de Correr a Madrina (estado por defecto o si el malo está lejos)
            else {
                player.state = 'running_to_madrina';
                // Si está cerca de la madrina objetivo, tocarla y avanzar a la siguiente
                if (distToMadrina < AI_RUN_TO_MADRINA_DIST) {
                    player.currentMadrinaIndex++;
                    if (player.currentMadrinaIndex < madrinas.length) {
                        player.setMadrina(madrinas[player.currentMadrinaIndex]);
                        console.log(`Jugador ${player.id} avanzó a madrina ${player.currentMadrinaIndex}`);
                    } else {
                        // Todos los niños llegaron a la última madrina
                        player.state = 'finished';
                        console.log(`Jugador ${player.id} ha completado el recorrido.`);
                    }
                } else {
                    // Moverse hacia la madrina actual
                    const angleToMadrina = Math.atan2(currentMadrina.y - player.y, currentMadrina.x - player.x);
                    player.x += Math.cos(angleToMadrina) * player.speed;
                    player.y += Math.sin(angleToMadrina) * player.speed;
                }
            }

            // --- Lógica de Movimiento del Malo (IA) ---
            if (player.isMalo) {
                if (ball.isHeld) { // Si el Malo tiene la pelota
                    // Intentar lanzar la pelota si un niño está cerca
                    let closestPlayer = null;
                    let minDistToPlayer = Infinity;

                    players.forEach(p => {
                        if (!p.isMalo && !p.isEliminated) {
                            const dist = utils.distance(malo.x, malo.y, p.x, p.y);
                            if (dist < minDistToPlayer) {
                                minDistToPlayer = dist;
                                closestPlayer = p;
                            }
                        }
                    });

                    if (closestPlayer && minDistToPlayer < AI_THROW_THRESHOLD) {
                        // Lanzar hacia el niño más cercano
                        const directionX = closestPlayer.x - malo.x;
                        const directionY = closestPlayer.y - malo.y;
                        const thrownBall = malo.throwBall(directionX, directionY, THROW_FORCE);
                        if (thrownBall) {
                            console.log("Malo lanzó la pelota!");
                            // Podríamos hacer que la pelota rebote en el malo si falla el lanzamiento
                        }
                    } else {
                        // Moverse aleatoriamente o hacia el centro si no hay niños cerca
                        player.state = 'wandering';
                    }
                } else { // Si el Malo NO tiene la pelota
                    // Moverse hacia la pelota libre
                    player.state = 'chasing_ball';
                    const angleToBall = Math.atan2(ball.y - player.y, ball.x - player.x);
                    player.x += Math.cos(angleToBall) * player.speed * 1.2; // El Malo es un poco más rápido
                    player.y += Math.sin(angleToBall) * player.speed * 1.2;

                    // Intentar recoger la pelota si está cerca
                    if (utils.distance(player.x, player.y, ball.x, ball.y) < player.radius + ball.radius) {
                        player.pickupBall(ball);
                        console.log("Malo recogió la pelota!");
                    }
                }
            }
        });
    }
}
