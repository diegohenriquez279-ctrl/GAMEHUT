// MINIJUEGO 5 - ARMA EL PRODUCTO
// Sistema de rondas: 4 pizzas aleatorias sin repetición
// Diego Fuentes | Junio 2026

// Tolerancia en px: si el dedo se desplaza más que esto entre pointerdown y pointerup,
// se considera scroll (no selecciona). Un toque casi quieto = TAP que selecciona.
const UMBRAL_TAP = 10;

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
        // Tap-to-place: paso seleccionado + handlers a nivel documento (misma ref para add/remove)
        this.pasoSeleccionado = null;
        this.candidatoPaso = null;
        this.pointerStartX = 0;
        this.pointerStartY = 0;
        this._avisoTimeout = null;
        this.finalizarTap = this.finalizarTap.bind(this);
        this.cancelarTap = this.cancelarTap.bind(this);
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
        this.pasoSeleccionado = null;
        pasosMezclados.forEach((paso, index) => {
            const div = document.createElement('div');
            div.className = 'paso-draggable';
            div.textContent = paso;
            div.dataset.paso = paso;
            div.dataset.indice = index;

            div.addEventListener('pointerdown', (e) => this.onPasoPointerDown(e));

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

            // Tap-to-place: tocar un hueco intenta colocar el paso seleccionado
            slot.addEventListener('click', () => this.manejarTapSlot(slot));

            this.zonaArmado.appendChild(slot);
        });
    }

    // Validación compartida por ARRASTRE y TAP-TO-PLACE — 3 casos:
    //  1) hueco fuera de orden        -> aviso guía, SIN penalizar
    //  2) hueco en orden, paso erróneo -> error real: -12s + shake + sonido
    //  3) hueco en orden, paso correcto -> coloca
    // Devuelve true solo si colocó (caso 3).
    intentarColocar(slotEl, pasoTexto) {
        if (!pasoTexto) return false;

        const slotIndice = parseInt(slotEl.dataset.indice);
        const nextIndice = this.contarPasosArmados();

        // Caso 1: salto de orden. No penaliza, solo guía.
        if (slotIndice !== nextIndice) {
            this.mostrarAvisoOrden();
            return false;
        }

        // Caso 2: hueco correcto pero paso equivocado. Error de receta.
        if (pasoTexto !== this.pasosCorrectos[slotIndice]) {
            slotEl.classList.add('error-shake');
            setTimeout(() => slotEl.classList.remove('error-shake'), 420);
            this.reproducirSonido('error');
            this.tiempoTotal = Math.max(0, this.tiempoTotal - 12);
            this.actualizarTimerDisplay();
            this.animarPenalizacion();
            return false;
        }

        // Caso 3: correcto.
        this.ocuparSlot(slotEl, pasoTexto, slotIndice);
        return true;
    }

    // Aviso guía NO punitivo (sin restar tiempo ni marcar error rojo).
    mostrarAvisoOrden() {
        let aviso = document.getElementById('mj5-aviso-orden');
        if (!aviso) {
            aviso = document.createElement('div');
            aviso.id = 'mj5-aviso-orden';
            aviso.className = 'mj5-aviso-orden';
            document.body.appendChild(aviso);
        }
        aviso.textContent = 'Debes ir en orden, del primer paso al último';
        aviso.classList.add('visible');
        clearTimeout(this._avisoTimeout);
        this._avisoTimeout = setTimeout(() => aviso.classList.remove('visible'), 1800);
    }

    ocuparSlot(slotEl, paso, indice) {
        slotEl.className = 'slot-ocupado';
        slotEl.innerHTML = `
            <span class="slot-num">${indice + 1}</span>
            <span class="slot-check">✓</span>
            <span class="slot-texto">${paso}</span>
        `;

        const elemento = Array.from(this.pasosBanco.children).find(el => el.dataset.paso === paso);
        if (elemento) {
            if (this.pasoSeleccionado === elemento) this.pasoSeleccionado = null;
            elemento.remove();
        }

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

    // === INTERACCIÓN: SOLO TAP-TO-PLACE (Pointer Events) ===
    // Sin arrastre: el scroll táctil lo maneja el navegador de forma nativa
    // (no hay touch-action:none). Un toque casi quieto selecciona; un
    // desplazamiento del dedo hace scroll y NO selecciona.
    onPasoPointerDown(e) {
        if (this.estadoActual !== 2) return;
        if (e.button != null && e.button !== 0) return; // solo primario / touch
        // Sin preventDefault: dejamos que el navegador pueda hacer scroll si el usuario desliza.

        this.candidatoPaso = e.currentTarget;
        this.pointerStartX = e.clientX;
        this.pointerStartY = e.clientY;

        document.addEventListener('pointerup', this.finalizarTap);
        document.addEventListener('pointercancel', this.cancelarTap);
    }

    finalizarTap(e) {
        document.removeEventListener('pointerup', this.finalizarTap);
        document.removeEventListener('pointercancel', this.cancelarTap);

        const paso = this.candidatoPaso;
        this.candidatoPaso = null;
        if (!paso) return;

        // Si el dedo se desplazó, fue un scroll (o intento): no seleccionar.
        const dx = e.clientX - this.pointerStartX;
        const dy = e.clientY - this.pointerStartY;
        if (Math.hypot(dx, dy) > UMBRAL_TAP) return;

        this.manejarTapPaso(paso);
    }

    cancelarTap() {
        // El navegador tomó el gesto como scroll: cancelar sin seleccionar.
        document.removeEventListener('pointerup', this.finalizarTap);
        document.removeEventListener('pointercancel', this.cancelarTap);
        this.candidatoPaso = null;
    }

    // === TAP-TO-PLACE: selección y colocación por toque ===
    manejarTapPaso(paso) {
        if (!paso) return;
        if (this.pasoSeleccionado === paso) {
            // Tap sobre el ya seleccionado -> deseleccionar
            paso.classList.remove('paso-seleccionado');
            this.pasoSeleccionado = null;
        } else {
            // Mover la selección al nuevo paso (no se acumulan)
            if (this.pasoSeleccionado) this.pasoSeleccionado.classList.remove('paso-seleccionado');
            this.pasoSeleccionado = paso;
            paso.classList.add('paso-seleccionado');
        }
    }

    manejarTapSlot(slotEl) {
        if (!this.pasoSeleccionado) return; // sin selección, el tap en hueco no hace nada
        // Misma validación de 3 casos que el arrastre. Si coloca, ocuparSlot limpia la selección.
        this.intentarColocar(slotEl, this.pasoSeleccionado.dataset.paso);
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
