// MINIJUEGO 5 - ARMA EL PRODUCTO
// Sistema de rondas: 4 pizzas aleatorias sin repetición
// Diego Fuentes | Junio 2026

class MinijuegoArmaPizza {
    constructor() {
        // Estado de partida
        this.estadoActual = 1;
        this.pizzaActual = null;
        this.pasosCorrectos = [];
        this.tiempoInicio = 0;
        this.tiempoTranscurrido = 0;
        this.tiempoTotal = 0;
        this.timerIntervalId = null;
        this.elementoArrastrado = null;
        if (localStorage.getItem('sonidos-habilitados') === null) {
            localStorage.setItem('sonidos-habilitados', 'true');
        }
        this.sonidosHabilitados = localStorage.getItem('sonidos-habilitados') === 'true';
        this.audioContext = null;
        this.ultimoSegundoTick = -1;
        this.umbralAmarillo = 0;
        this.umbralRojo = 0;
        this.tiempoTotalInicial = 0;

        // Estado de ronda
        this.pizzasRonda = [];
        this.indicePizzaActual = 0;
        this.tiempoRondaInicio = 0;
        this.tiempoTotalRonda = 0;
        this.pizzasCorrectasRonda = 0;
        this.pizzasIncorrectasRonda = 0;
        this.pizzasFaildasPorTiempo = 0;
        this.pizzasFaildasPorError = 0;

        // DOM
        this.estado1 = document.getElementById('estado1');
        this.estado2 = document.getElementById('estado2');
        this.estado3 = document.getElementById('estado3');
        this.btnComenzar = document.getElementById('btnComenzar');
        this.btnVolver = document.getElementById('btnVolver');
        this.btnAbandonar = document.getElementById('btnAbandonar');
        this.btnJugarDeNuevo = document.getElementById('btnJugarDeNuevo');
        this.btnVoverAlMenu = document.getElementById('btnVoverAlMenu');
        this.btnSonido = document.getElementById('btnSonido');
        this.pasosBanco = document.getElementById('pasosBanco');
        this.zonaArmado = document.getElementById('zonaArmado');
        this.nombrePizza = document.getElementById('nombrePizza');
        this.timerDisplay = document.getElementById('timerDisplay');
        this.timerBar = document.getElementById('timerBar');
        this.timerContainer = document.getElementById('timerContainer');
        this.recordPre = document.getElementById('recordPre');
        this.badgeNuevoRecord = document.getElementById('badgeNuevoRecord');

        // Event listeners
        this.btnComenzar.addEventListener('click', () => this.comenzarJuego());
        this.btnVolver.addEventListener('click', () => this.volverAlMenu());
        this.btnAbandonar.addEventListener('click', () => {
            this.indicePizzaActual = 0;
            this.mostrarEstado(1);
        });
        this.btnJugarDeNuevo.addEventListener('click', () => {
            this.indicePizzaActual = 0;
            this.pizzasCorrectasRonda = 0;
            this.pizzasFaildasPorTiempo = 0;
            this.pizzasFaildasPorError = 0;
            this.comenzarJuego();
        });
        this.btnVoverAlMenu.addEventListener('click', () => {
            this.indicePizzaActual = 0;
            this.mostrarEstado(1);
        });
        this.btnSonido.addEventListener('click', () => this.toggleSonido());

        this.actualizarRecord();
    }

    // === GESTIÓN DE ESTADOS ===
    mostrarEstado(estado) {
        this.estado1.classList.add('oculto');
        this.estado2.classList.add('oculto');
        this.estado3.classList.add('oculto');

        if (estado === 1) this.estado1.classList.remove('oculto');
        else if (estado === 2) this.estado2.classList.remove('oculto');
        else if (estado === 3) this.estado3.classList.remove('oculto');

        this.estadoActual = estado;

        if (estado === 1 || estado === 3) {
            if (this.timerIntervalId) clearInterval(this.timerIntervalId);
        }
    }

    // === AUDIO ===
    inicializarAudio() {
        if (!this.audioContext) {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                console.error('AudioContext no disponible:', e);
                this.sonidosHabilitados = false;
                return;
            }
        }
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    // === RONDA ===
    seleccionarPizzasRonda() {
        const bancoCopia = [...PIZZAS_MJ5];
        this.pizzasRonda = [];
        for (let i = 0; i < 4; i++) {
            const idx = Math.floor(Math.random() * bancoCopia.length);
            this.pizzasRonda.push(bancoCopia[idx]);
            bancoCopia.splice(idx, 1);
        }
        this.indicePizzaActual = 0;
        this.tiempoTotalRonda = 0;
        this.pizzasCorrectasRonda = 0;
        this.pizzasIncorrectasRonda = 0;
        this.pizzasFaildasPorTiempo = 0;
        this.pizzasFaildasPorError = 0;
        this.tiempoRondaInicio = Date.now();
    }

    // === FLUJO DEL JUEGO ===
    comenzarJuego() {
        this.inicializarAudio();
        if (this.indicePizzaActual === 0) {
            this.seleccionarPizzasRonda();
        }

        this.pizzaActual = this.pizzasRonda[this.indicePizzaActual];
        this.pasosCorrectos = [...this.pizzaActual.pasos];
        const pasosMezclados = mezclarPasos(this.pizzaActual.pasos);

        this.nombrePizza.textContent = this.pizzaActual.nombre;

        const contadorPizza = document.getElementById('contadorPizza');
        if (contadorPizza) contadorPizza.textContent = `Pizza ${this.indicePizzaActual + 1} de 4`;

        this.tiempoTotal = this.pizzaActual.pasos.length <= 5 ? 80 : 120;
        this.tiempoTotalInicial = this.tiempoTotal;
        this.umbralAmarillo = Math.floor(this.tiempoTotal * 0.5);
        this.umbralRojo = Math.floor(this.tiempoTotal * 0.25);
        this.ultimoSegundoTick = -1;
        this.tiempoTranscurrido = 0;
        this.tiempoInicio = Date.now();

        // Renderizar banco de pasos
        this.pasosBanco.innerHTML = '';
        pasosMezclados.forEach((paso, index) => {
            const div = document.createElement('div');
            div.className = 'paso-draggable';
            div.draggable = true;
            div.textContent = paso;
            div.dataset.paso = paso;
            div.dataset.indice = index;

            div.addEventListener('dragstart', (e) => this.handleDragStart(e));
            div.addEventListener('dragend', (e) => this.handleDragEnd(e));

            this.pasosBanco.appendChild(div);
        });

        // Generar huecos visuales de armado
        this.generarSlots();

        this.mostrarEstado(2);
        this.iniciarTimer();
    }

    // === SLOTS DE ARMADO ===
    generarSlots() {
        this.zonaArmado.innerHTML = '';
        this.pasosCorrectos.forEach((_, i) => {
            const slot = document.createElement('div');
            slot.className = 'slot-hueco';
            slot.dataset.indice = i;
            slot.innerHTML = `<span class="slot-num">${i + 1}</span>?`;

            slot.addEventListener('dragover', (e) => {
                e.preventDefault();
                slot.classList.add('drag-over-slot');
            });
            slot.addEventListener('dragleave', () => {
                slot.classList.remove('drag-over-slot');
            });
            slot.addEventListener('drop', (e) => {
                e.preventDefault();
                slot.classList.remove('drag-over-slot');
                this.handleDropEnSlot(slot);
            });

            this.zonaArmado.appendChild(slot);
        });
    }

    handleDropEnSlot(slotEl) {
        const paso = this.elementoArrastrado?.dataset.paso;
        if (!paso) return;

        const slotIndice = parseInt(slotEl.dataset.indice);
        const nextIndice = this.contarPasosArmados();

        if (slotIndice !== nextIndice || paso !== this.pasosCorrectos[slotIndice]) {
            slotEl.classList.add('error-shake');
            setTimeout(() => slotEl.classList.remove('error-shake'), 420);
            this.reproducirSonido('error');
            this.tiempoTotal = Math.max(0, this.tiempoTotal - 12);
            this.actualizarTimerDisplay();
            this.animarPenalizacion();
            return;
        }

        this.ocuparSlot(slotEl, paso, slotIndice);
    }

    ocuparSlot(slotEl, paso, indice) {
        slotEl.className = 'slot-ocupado';
        slotEl.innerHTML = `
            <span class="slot-num">${indice + 1}</span>
            <span class="slot-check">✓</span>
            <span class="slot-texto">${paso}</span>
        `;

        const elemento = Array.from(this.pasosBanco.children).find(el => el.dataset.paso === paso);
        if (elemento) elemento.remove();

        this.reproducirSonido('acierto');

        if (this.contarPasosArmados() === this.pasosCorrectos.length) {
            clearInterval(this.timerIntervalId);
            setTimeout(() => this.finalizarJuego(true), 500);
        }
    }

    finalizarJuego(exitoso) {
        if (this.timerIntervalId) {
            clearInterval(this.timerIntervalId);
            this.timerIntervalId = null;
        }

        if (exitoso) {
            this.pizzasCorrectasRonda++;
        } else {
            this.pizzasFaildasPorTiempo++;
        }

        if (this.indicePizzaActual === 3) {
            this.tiempoTotalRonda = Math.floor((Date.now() - this.tiempoRondaInicio) / 1000);
            setTimeout(() => this.finalizarRonda(), 1000);
        } else {
            this.indicePizzaActual++;
            setTimeout(() => this.comenzarJuego(), 1500);
        }
    }

    animarPenalizacion() {
        // Forzar reflow para reiniciar la animación aunque ya estuviera corriendo
        this.timerDisplay.style.animation = 'none';
        void this.timerDisplay.offsetWidth;
        this.timerDisplay.style.animation = 'shakeTimer 0.4s ease-in-out';
        this.timerContainer.style.backgroundColor = 'rgba(244, 67, 54, 0.2)';

        setTimeout(() => {
            // Limpiar inline style: deja que la clase CSS retome el control
            this.timerDisplay.style.animation = '';
            this.timerContainer.style.backgroundColor = '';
        }, 500);
    }

    contarPasosArmados() {
        return this.zonaArmado.querySelectorAll('.slot-ocupado').length;
    }

    // === DRAG AND DROP ===
    handleDragStart(e) {
        this.elementoArrastrado = e.target;
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', e.target.dataset.paso);
    }

    handleDragEnd(e) {
        e.target.classList.remove('dragging');
        this.elementoArrastrado = null;
    }

    // === TIMER ===
    iniciarTimer() {
        this.timerIntervalId = setInterval(() => {
            const ahora = Date.now();
            this.tiempoTranscurrido = Math.floor((ahora - this.tiempoInicio) / 1000);

            // Actualizar display primero para que el usuario vea 00:00
            this.actualizarTimerDisplay();

            if (this.tiempoTranscurrido >= this.tiempoTotal) {
                clearInterval(this.timerIntervalId);
                this.timerIntervalId = null;
                this.tiempoTranscurrido = this.tiempoTotal;
                this.actualizarTimerDisplay();

                // Pausa breve para que el usuario vea el 00:00
                setTimeout(() => this.finalizarJuego(false), 500);
                return;
            }
        }, 100);
    }

    actualizarTimerDisplay() {
        const segundosRestantes = Math.max(0, this.tiempoTotal - this.tiempoTranscurrido);
        const minutos = Math.floor(segundosRestantes / 60);
        const segundos = segundosRestantes % 60;
        this.timerDisplay.textContent = `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;

        let timerClass = 'verde';
        if (segundosRestantes <= this.umbralRojo) {
            timerClass = 'rojo';
        } else if (segundosRestantes <= this.umbralAmarillo) {
            timerClass = 'amarillo';
        }

        this.timerDisplay.className = timerClass;
        this.timerBar.className = timerClass;

        const anchoBarra = this.tiempoTotalInicial > 0
            ? (segundosRestantes / this.tiempoTotalInicial) * 100
            : 0;
        this.timerBar.style.width = Math.max(0, Math.min(100, anchoBarra)) + '%';

        if (timerClass === 'rojo' && this.sonidosHabilitados) {
            const segundoActual = Math.floor(this.tiempoTranscurrido);
            if (this.ultimoSegundoTick !== segundoActual) {
                this.ultimoSegundoTick = segundoActual;
                this.reproducirSonido('tick');
            }
        }
    }

    // === RESULTADO DE RONDA ===
    finalizarRonda() {
        const minimoAlcanzado = this.pizzasCorrectasRonda >= 3;
        const recordAnterior = this.getRecord();
        const esNuevoRecord = minimoAlcanzado && (!recordAnterior || this.tiempoTotalRonda < recordAnterior);

        if (esNuevoRecord) {
            this.guardarRecord(this.tiempoTotalRonda);
            this.reproducirSonido('fanfare');
        }

        const totalFallidasPorError = Math.max(0, 4 - this.pizzasCorrectasRonda - this.pizzasFaildasPorTiempo);

        document.getElementById('resultadoTiempo').textContent = this.formatearTiempo(this.tiempoTotalRonda);
        document.getElementById('resultadoCompletadas').textContent = `${this.pizzasCorrectasRonda} / 4`;
        document.getElementById('resultadoFaildasTiempo').textContent = String(this.pizzasFaildasPorTiempo);
        document.getElementById('resultadoFaildasError').textContent = String(totalFallidasPorError);

        const nuevoRecordBox = document.getElementById('nuevoRecordBox');
        if (esNuevoRecord) {
            document.getElementById('resultadoNuevoRecord').textContent = this.formatearTiempo(this.tiempoTotalRonda);
            nuevoRecordBox.style.borderColor = '#4CAF50';
        } else {
            document.getElementById('resultadoNuevoRecord').textContent = recordAnterior
                ? this.formatearTiempo(recordAnterior)
                : '—';
            nuevoRecordBox.style.borderColor = '#333';
        }

        const elMensajeMinimo = document.getElementById('resultadoMensajeMinimo');
        if (elMensajeMinimo) {
            elMensajeMinimo.classList.toggle('oculto', minimoAlcanzado);
            elMensajeMinimo.textContent = minimoAlcanzado
                ? ''
                : 'Necesitas al menos 3 de 4 pizzas para registrar récord. ¡Inténtalo de nuevo!';
        }

        this.mostrarEstado(3);
    }

    formatearTiempo(segundos) {
        const min = Math.floor(segundos / 60);
        const seg = segundos % 60;
        return `${min}:${seg.toString().padStart(2, '0')}`;
    }

    // === RÉCORD ===
    getRecord() {
        if (typeof getScore !== 'function') return null;
        const record = getScore('minijuego-5');
        return record && isFinite(record.tiempo) ? record.tiempo : null;
    }

    guardarRecord(tiempo) {
        if (typeof saveScore !== 'function') return;
        if (tiempo < 3600) {
            saveScore('minijuego-5', { tiempo: tiempo });
        }
    }

    actualizarRecord() {
        const record = this.getRecord();
        this.recordPre.textContent = record ? this.formatearTiempo(record) : '—';
    }

    // === SONIDOS ===
    reproducirSonido(tipo) {
        if (!this.sonidosHabilitados || !this.audioContext) return;

        const audioContext = this.audioContext;
        const oscilador = audioContext.createOscillator();
        const envolvente = audioContext.createGain();

        oscilador.connect(envolvente);
        envolvente.connect(audioContext.destination);

        switch (tipo) {
            case 'acierto':
                oscilador.frequency.setValueAtTime(800, audioContext.currentTime);
                oscilador.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.15);
                envolvente.gain.setValueAtTime(0.3, audioContext.currentTime);
                envolvente.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
                oscilador.start(audioContext.currentTime);
                oscilador.stop(audioContext.currentTime + 0.15);
                break;

            case 'error':
                oscilador.frequency.setValueAtTime(300, audioContext.currentTime);
                oscilador.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.2);
                envolvente.gain.setValueAtTime(0.3, audioContext.currentTime);
                envolvente.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                oscilador.start(audioContext.currentTime);
                oscilador.stop(audioContext.currentTime + 0.2);
                break;

            case 'tick':
                oscilador.frequency.setValueAtTime(900, audioContext.currentTime);
                envolvente.gain.setValueAtTime(0.1, audioContext.currentTime);
                envolvente.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.04);
                oscilador.start(audioContext.currentTime);
                oscilador.stop(audioContext.currentTime + 0.04);
                break;

            case 'fanfare':
                const notas = [
                    { freq: 261.63, duracion: 0.2 },
                    { freq: 329.63, duracion: 0.2 },
                    { freq: 392.00, duracion: 0.4 }
                ];
                let tiempoActual = audioContext.currentTime;
                notas.forEach(nota => {
                    const osc = audioContext.createOscillator();
                    const env = audioContext.createGain();
                    osc.connect(env);
                    env.connect(audioContext.destination);
                    osc.frequency.setValueAtTime(nota.freq, tiempoActual);
                    env.gain.setValueAtTime(0.3, tiempoActual);
                    env.gain.exponentialRampToValueAtTime(0.01, tiempoActual + nota.duracion);
                    osc.start(tiempoActual);
                    osc.stop(tiempoActual + nota.duracion);
                    tiempoActual += nota.duracion;
                });
                break;
        }
    }

    toggleSonido() {
        this.sonidosHabilitados = !this.sonidosHabilitados;
        this.btnSonido.textContent = this.sonidosHabilitados ? '🔊' : '🔇';
        localStorage.setItem('sonidos-habilitados', String(this.sonidosHabilitados));
        if (this.sonidosHabilitados) {
            this.inicializarAudio();
        }
    }

    volverAlMenu() {
        window.location.href = 'index.html';
    }
}

// === INICIALIZACIÓN ===
let juego;
document.addEventListener('DOMContentLoaded', () => {
    juego = new MinijuegoArmaPizza();
});
