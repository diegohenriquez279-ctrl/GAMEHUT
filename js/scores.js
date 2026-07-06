/* ========================================
   GAMEHUT — Sistema de Records
   Archivo: scores.js
   Autor: Diego Fuentes
   ======================================== */

// Prefijo de la clave con la que guardamos el record de cada minijuego
// en localStorage. La clave final se arma con el id recibido, así cada
// minijuego queda aislado (ej. id "minijuego-1" -> "gamehut_score_minijuego-1").
const SCORE_KEY_PREFIX = 'gamehut_score_';

// Leer el record guardado de un minijuego
// Si no existe ningún record aún, devuelve null
function getScore(minijuegoId) {
    const key = SCORE_KEY_PREFIX + minijuegoId;
    const saved = localStorage.getItem(key);
    if (saved === null) return null;
    return JSON.parse(saved);
}

// Guardar un nuevo record para un minijuego
function saveScore(minijuegoId, scoreData) {
    const key = SCORE_KEY_PREFIX + minijuegoId;
    localStorage.setItem(key, JSON.stringify(scoreData));
}

// Borrar el record de un minijuego específico
function clearScore(minijuegoId) {
    const key = SCORE_KEY_PREFIX + minijuegoId;
    localStorage.removeItem(key);
}

// Borrar TODOS los records de la app
function clearAllScores() {
    for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.indexOf(SCORE_KEY_PREFIX) === 0) {
            localStorage.removeItem(key);
        }
    }
}