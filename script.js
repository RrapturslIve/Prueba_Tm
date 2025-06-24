let isAudioPlaying = false;
let activeAudios = [];
let isWelcomePlaying = false;
let welcomeAudio;
let video;
let avatar;
let currentAudio = null; 
let habitacionActual = 'habitacion_1';
let seccionActual = 'seccion_1';
let imagenesPorCaja = {};
let subtitulosPorCaja = [];
let preguntasGrupoActual = [];
let preguntaActual = 0;
let gruposDePreguntas = {};
let estabaReproduciendo = false;
let animacionTextoID = null; 
let respuestasCorrectas = 0;

/*-------------------Juego----------------------------*/
    const audioCorrecto = new Audio("qz-yes.mp3");
    const audioIncorrecto = new Audio("qz-error.mp3");
    const sonidoFondo = new Audio("qz-fondo.mp3");
    sonidoFondo.loop = true; // Para que se repita automáticamente
    sonidoFondo.volume = 1; // Volumen entre 0.0 (silencio) y 1.0 (máximo)

/*-------------------Juego----------------------------*/

function getRutaBase() {
  return `habitaciones/${habitacionActual}/${seccionActual}`;
}

function actualizarFondoHabitacion() {
  const rutaFondo = `habitaciones/${habitacionActual}/fondo.jpg`;
  document.querySelector('.background-overlay').style.backgroundImage = `url('${rutaFondo}')`;
}

window.addEventListener("DOMContentLoaded", () => {
  inicializarImagenes();
});

document.addEventListener("DOMContentLoaded", () => {
  const startButton = document.getElementById("start-button");
  welcomeAudio = document.getElementById("welcome-audio");
  video = document.getElementById("aiko-video");
  avatar = document.getElementById("avatar");
  const welcomeScreen = document.getElementById("welcome-screen");
  const mainUI = document.getElementById("app");

  startButton.addEventListener("click", async () => {
  playClickSound();
  mostrarLoaderInicial(); // ⏳ muestra el spinner si lo estás usando

  // 1. Preparar la sección silenciosamente (crea el DOM de la galería)
  await cargarSeccionMinima();

  // 2. Iniciar animación de salida de bienvenida
  welcomeScreen.classList.add("blur-out");

  // 3. Cuando termina la animación, mostrar la interfaz principal
  welcomeScreen.addEventListener("animationend", () => {
    welcomeScreen.classList.add("hidden");
    mainUI.classList.remove("hidden");
    ocultarLoaderInicial();

    avatar.classList.add("hidden");
    video.classList.add("playing");
    video.currentTime = 0;
    video.play().catch(err => console.warn("Video bloqueado:", err));

    welcomeAudio.play().catch(err => console.warn("Audio bloqueado:", err));
    isWelcomePlaying = true;
    welcomeAudio.onended = stopWelcomePlayback;

    const dialogueBox = document.getElementById("dialogue-box");
    escribirTextoGradualmente("¡Hola! Soy Aiko, su guía virtual. ¿Qué información deseas conocer?", dialogueBox);
    aplicarAnimacionesEntrada();
  }, { once: true });
});

});

/* Animacion del loader COMIENZO */
function mostrarLoaderInicial() {
  let loader = document.getElementById('loader-inicial');
  if (!loader) {
    loader = document.createElement('div');
    loader.id = 'loader-inicial';
    loader.innerHTML = `<div class="loader-spinner"></div>`;
    document.body.appendChild(loader);
  }
  loader.classList.remove('hidden');  
}

function ocultarLoaderInicial() {
  const loader = document.getElementById('loader-inicial');
  if (loader) {
    loader.classList.add('hidden');
  }
}

function aplicarAnimacionesEntrada() {
  const elementosIzquierda = [
    document.getElementById("avatar-container"),
    document.getElementById("aiko-video"),
    document.getElementById("boton-imagen-container")
  ];
  
  const elementosDerecha = [
    document.getElementById("mapa-contenedor"),
    document.getElementById("galeria-slider")
  ];

  [...elementosIzquierda, ...elementosDerecha].forEach(el => {
    if (!el) return;

    el.classList.remove("slide-in-left", "slide-in-right");
    void el.offsetWidth; // Forzar reflow para reiniciar animación
  });

  elementosIzquierda.forEach(el => el?.classList.add("slide-in-left"));
  elementosDerecha.forEach(el => el?.classList.add("slide-in-right"));
}


/*Funcion maquina de escribir=====*/
function escribirTextoGradualmente(texto, elemento, velocidad = 60) {
  if (animacionTextoID) {
    clearTimeout(animacionTextoID);
    animacionTextoID = null;
  }

  let i = 0;
  elemento.textContent = "";

  function escribir() {
    if (i < texto.length) {
      elemento.textContent += texto.charAt(i);
      i++;
      animacionTextoID = setTimeout(escribir, velocidad);
    } else {
      animacionTextoID = null; // terminada
    }
  }
  escribir();
}

/*boton activo Visual========================*/
function marcarBotonActivo(seccionID) {
  const botones = document.querySelectorAll('#galeria-controles button');
  botones.forEach((btn) => {
    const accion = btn.getAttribute("onclick");
    const activa = accion && accion.includes(seccionID);
    btn.classList.toggle("active", activa);
  });
}

function mostrarImagen(index) {
  const items = document.querySelectorAll('.item-galeria');
  items.forEach((item, i) => {
    item.classList.toggle('active', i === index);
  });

  // Esperar a que la imagen esté completamente cargada
  const contenedorActivo = document.querySelector('.item-galeria.active .imagen-caja img');
  if (contenedorActivo) {
    if (contenedorActivo.complete) {
    } else {
      contenedorActivo.onload = finalizarTransicionInicio;
    }
  } else {
    console.warn("⚠️ Imagen inicial no encontrada");// fallback
  }
}

/* llama a cambiar habitacion */
function irAHabitacion(habitacionID, seccionID) {
  habitacionActual = habitacionID;
  seccionActual = seccionID;

  // Cambiar fondo
  const rutaFondo = `habitaciones/${habitacionID}/fondo.jpg`;
  document.querySelector('.background-overlay').style.backgroundImage = `url('${rutaFondo}')`;

  cambiarSeccion(seccionID);
}

/* cambiar entre habitaciones ===========================*/
function cambiarSeccion(seccionID) {
  seccionActual = seccionID; // ✅ actualiza correctamente
  const ruta = getRutaBase();
  // Cargar data.json
  fetch(`${ruta}/data.json`)
  .then(res => res.json())
  .then(data => {
    imagenesPorCaja = data.imagenesPorCaja || {};

    const galeriaSlider = document.getElementById("galeria-slider");
    galeriaSlider.innerHTML = "";

    Object.keys(imagenesPorCaja).forEach((key, i) => {
      const item = document.createElement("div");
      item.classList.add("item-galeria");
      if (i === 0) item.classList.add("active");
      item.dataset.index = i;

      item.innerHTML = `
        <div class="titulo-caja">${data.titulos?.[i] || `Obra ${i + 1}`}</div>
        <div class="subtitulo-caja">${data.subtitulos?.[i] || ""}</div>
        <div class="imagen-caja" data-index="${i}" data-step="0">
          <button class="btn-audio" onclick="reproducirAudio(this)">⟲</button>
          <button class="btn-subimg" onclick="cambiarSubimagen(this)">▶</button>
          <button class="btn-retroceso" onclick="retrocederSubimagen(this)">◀</button>
          <img alt="Obra">
        </div>
      `;
      galeriaSlider.appendChild(item);
    });

  subtitulosPorCaja = data.subtitulos || [];
  marcarBotonActivo(seccionID); // ✅ actualiza visualmente el botón correcto
    inicializarImagenes();
    // Esperar a que se cree la galería Y se cargue la imagen
  setTimeout(() => {
   mostrarImagen(0); // esta vez dentro de DOM seguro
  }, 100); // pequeño retardo para asegurar que el DOM se pintó
    if (!isWelcomePlaying) {
  reproducirAudio(document.querySelector('.imagen-caja .btn-audio'));
  }
  });

  cerrarImagenSuperpuesta();
}

function inicializarImagenes() {
  const ruta = getRutaBase();
  const contenedores = document.querySelectorAll('.imagen-caja');

  contenedores.forEach(contenedor => {
    const index = parseInt(contenedor.dataset.index);
    const img = contenedor.querySelector('img');
    const retro = contenedor.querySelector('.btn-retroceso');
    const avanzar = contenedor.querySelector('.btn-subimg');

    contenedor.dataset.step = 0;
    const lista = imagenesPorCaja[index] || [];
    img.src = `${ruta}/imagenes/${lista[0].replace(/^.*\//, '')}`; // elimina el "seccion_x/" interno si viene
    const subtituloCaja = contenedor.parentElement.querySelector('.subtitulo-caja');
    const subtitulo = subtitulosPorCaja[index]?.[0] || "";
    if (subtituloCaja) subtituloCaja.textContent = subtitulo;
    if (retro) retro.style.display = "none";
    if (avanzar && lista.length <= 1) avanzar.style.display = "none";
  });
}
function cambiarSoloSeccion(seccionID) {
  seccionActual = seccionID;
  cambiarSeccion(seccionID);
}

function stopWelcomePlayback() {
  if (!isWelcomePlaying) return;

  isWelcomePlaying = false;

  if (welcomeAudio) {
    welcomeAudio.pause();
    welcomeAudio.currentTime = 0;
  }

  if (video) {
    video.pause();
    video.classList.remove("playing");
  }

  if (avatar) {
    avatar.classList.remove("hidden");
  }
}
/* Reproducir click = playClickSound(); ========*/
function playClickSound() {
  const clickSound = document.getElementById("click-sound");
  if (clickSound) {
    clickSound.currentTime = 0;
    clickSound.play();
  }
}

function reproducirAudio(button) {
  const ruta = getRutaBase(); // ✅ usa ruta actual
  playClickSound();
  // Detener audio anterior si existe
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }

  const contenedor = button.closest('.imagen-caja');
  const index = parseInt(contenedor.dataset.index);
  const step = parseInt(contenedor.dataset.step);
  const dialogueBox = document.getElementById("dialogue-box");

  const audioName = `audio${index + 1}${step > 0 ? `_sub${step}` : ''}`;
  const seccion = `seccion_${index + 1}`;

  const audio = new Audio(`${ruta}/audios/${audioName}.mp3`);
  fetch(`${ruta}/textos/${audioName}.txt`)
    .then(res => res.text())
    .then(text => {
      escribirTextoGradualmente(text, dialogueBox, 30);
    })
    .catch(() => {
      dialogueBox.textContent = "(Mensaje no disponible)";
    });
  // Limpiar cuando termina el audio
  audio.play();
  currentAudio = audio;

  // Iniciar video animado y ocultar avatar
  playVideoLoop();
}

/* cambio de sub imagenes ====================================*/
function cambiarSubimagen(button) {
  const contenedor = button.closest('.imagen-caja');
  const index = parseInt(contenedor.dataset.index);
  let step = parseInt(contenedor.dataset.step);
  const img = contenedor.querySelector('img');
  const retro = contenedor.querySelector('.btn-retroceso');
  const avanzar = contenedor.querySelector('.btn-subimg');
  const lista = imagenesPorCaja[index];

  playClickSound();

  if (step < lista.length - 1) {
    step++;

    // Mostrar loader
    const overlay = document.createElement("div");
    overlay.className = "loader-overlay";
    const spinner = document.createElement("div");
    spinner.className = "loader-spinner";
    overlay.appendChild(spinner);
    contenedor.appendChild(overlay);

    img.onload = () => {
      contenedor.removeChild(overlay);
      contenedor.dataset.step = step;

      const subtituloCaja = contenedor.parentElement.querySelector('.subtitulo-caja');
      const subtitulo = subtitulosPorCaja[index]?.[step] || "";
      if (subtituloCaja) subtituloCaja.textContent = subtitulo;

      retro.style.display = step > 0 ? "block" : "none";
      avanzar.style.display = step >= lista.length - 1 ? "none" : "block";

      reproducirAudio(button);
    };

    img.src = `${getRutaBase()}/imagenes/${lista[step].replace(/^.*\//, '')}`;
  }
}


function retrocederSubimagen(button) {
  const contenedor = button.closest('.imagen-caja');
  const index = parseInt(contenedor.dataset.index);
  let step = parseInt(contenedor.dataset.step);
  const img = contenedor.querySelector('img');
  const retro = contenedor.querySelector('.btn-retroceso');
  const avanzar = contenedor.querySelector('.btn-subimg');
  const lista = imagenesPorCaja[index];

  playClickSound();

  if (step > 0) {
    step--;

    // Mostrar loader
    const overlay = document.createElement("div");
    overlay.className = "loader-overlay";
    const spinner = document.createElement("div");
    spinner.className = "loader-spinner";
    overlay.appendChild(spinner);
    contenedor.appendChild(overlay);

    img.onload = () => {
      contenedor.removeChild(overlay);
      contenedor.dataset.step = step;

      const subtituloCaja = contenedor.parentElement.querySelector('.subtitulo-caja');
      const subtitulo = subtitulosPorCaja[index]?.[step] || "";
      if (subtituloCaja) subtituloCaja.textContent = subtitulo;

      retro.style.display = step === 0 ? "none" : "block";
      avanzar.style.display = "block";

      reproducirAudio(button);
    };

    img.src = `${getRutaBase()}/imagenes/${lista[step].replace(/^.*\//, '')}`;
  }
}

/* AUDIO Y IMAGENES DE CAJA FINNNN   ==========*/

function mostrarImagenSuperpuesta() {
  const boton = document.activeElement;

  if (boton && boton.classList.contains("btn-imagen")) {
    boton.classList.add("hidden");
    setTimeout(() => boton.classList.remove("hidden"), 300);
  }

  playClickSound();
  document.getElementById("imagen-superpuesta").classList.remove("hidden");
  document.getElementById("galeria-slider").classList.add("hidden");
}

function cerrarImagenSuperpuesta() {
  document.getElementById("imagen-superpuesta").classList.add("hidden");
  document.getElementById("galeria-slider").classList.remove("hidden");
  playClickSound();
}
/*Reproducir video aiko hablando =====================*/
function playVideoLoop() {
  stopWelcomePlayback()
  if (!video || !avatar) return;

  // Oculta el avatar y muestra el video
  avatar.classList.add("hidden");
  video.classList.add("playing");
  video.currentTime = 0;
  video.play().catch(err => console.error("Error al reproducir video:", err));

  // Cuando termine el video, revertir visibilidad
  video.onended = () => {
    video.classList.remove("playing");
    avatar.classList.remove("hidden");
  };
}

/* enviar mensaje a ia============================================*/
async function sendMessage() {
  const input = document.getElementById("userInput");
  const text = input.value.trim();
  if (!text) return;

  const dialogueBox = document.getElementById("dialogue-box");
  const avatar = document.getElementById("avatar");
  const video = document.getElementById("aiko-video");

  dialogueBox.textContent = "Pensando...";
  input.value = "";

  // Mostrar video
  avatar.classList.add("hidden");
  video.classList.add("playing");
  video.currentTime = 0;
  video.play();

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: text })
    });

    const data = await response.json();
    const reply = data.reply || "Sin respuesta del servidor.";
    dialogueBox.textContent = reply;
    // Auto-scroll hacia el fondo si el texto es largo
    dialogueBox.scrollTop = dialogueBox.scrollHeight;

    speak(reply);
  } catch (err) {
    dialogueBox.textContent = "Hubo un error al conectarse con el servidor.";
    console.error(err);
  } finally {
    video.onended = () => {
      video.classList.remove("playing");
      avatar.classList.remove("hidden");
    };
  }
  }
  /* bot lee el dialogo chat =============*/
  function speak(text) {
  const synth = window.speechSynthesis;
  const utterance = new SpeechSynthesisUtterance(text);

  // Buscar una voz femenina en español
  const voices = synth.getVoices();
  const spanishVoices = voices.filter(voice => voice.lang.startsWith("es") && voice.name.toLowerCase().includes("female"));
  if (spanishVoices.length > 0) {
    utterance.voice = spanishVoices[0];
  } else {
    utterance.lang = "es-ES";
  }

  // Opcional: controlar volumen, velocidad y tono
  utterance.volume = 1;   // 0 a 1
  utterance.rate = 1;     // velocidad (1 = normal)
  utterance.pitch = 1;  // tono (1 = normal, >1 más agudo)

  synth.cancel(); // detener voz previa si existe
  synth.speak(utterance);
}

function esperarRecursosIniciales(timeoutMs = 2000) {
  return new Promise(resolve => {
    let isResolved = false;

    // Respaldo: después de timeout forzamos continuar
    const timeout = setTimeout(() => {
      if (!isResolved) {
        console.warn("⏳ Continuando sin terminar de cargar todos los recursos...");
        isResolved = true;
        resolve();
      }
    }, timeoutMs);

    const fondo = new Image();
    fondo.src = `habitaciones/${habitacionActual}/fondo.jpg`;

    const avatar = document.getElementById("avatar");
    const video = document.getElementById("aiko-video");

    // Esperar a que la galería esté en el DOM
    const esperarGaleria = new Promise(galeriaRes => {
      const esperar = () => {
        const img = document.querySelector('.imagen-caja img');
        if (img && img.complete) return galeriaRes(img);
        if (img) {
          img.onload = () => galeriaRes(img);
        } else {
          setTimeout(esperar, 100); // esperar hasta que exista
        }
      };
      esperar();
    });

    Promise.all([
      new Promise(res => fondo.onload = res),
      new Promise(res => video.readyState >= 3 ? res() : video.oncanplay = res),
      esperarGaleria
    ]).then(() => {
      if (!isResolved) {
        clearTimeout(timeout);
        isResolved = true;
        resolve();
      }
    });
  });
}
async function cargarSeccionMinima() {
  habitacionActual = 'habitacion_1';
  seccionActual = 'seccion_1';

  const ruta = getRutaBase(); // = habitaciones/habitacion_1/seccion_1

  // Cargar el JSON con la galería
  const res = await fetch(`${ruta}/data.json`);
  const data = await res.json();

  imagenesPorCaja = data.imagenesPorCaja || {};
  subtitulosPorCaja = data.subtitulos || [];

  const galeriaSlider = document.getElementById("galeria-slider");
  galeriaSlider.innerHTML = "";
  marcarBotonActivo('seccion_1');

  // Crear solo el primer .item-galeria (index 0)
  const key = Object.keys(imagenesPorCaja)[0];
  const lista = imagenesPorCaja[key];

  const item = document.createElement("div");
  item.classList.add("item-galeria", "active");
  item.dataset.index = 0;

  item.innerHTML = `
    <div class="titulo-caja">${data.titulos?.[0] || `Obra 1`}</div>
    <div class="subtitulo-caja">${data.subtitulos?.[0]?.[0] || ""}</div>
    <div class="imagen-caja" data-index="0" data-step="0">
      <button class="btn-audio" onclick="reproducirAudio(this)">⟲</button>
      <button class="btn-subimg" onclick="cambiarSubimagen(this)">▶</button>
      <button class="btn-retroceso" onclick="retrocederSubimagen(this)">◀</button>
      <img alt="Obra">
    </div>
  `;

  galeriaSlider.appendChild(item);

  // Inicializar imagen
  const contenedor = item.querySelector('.imagen-caja');
  const img = contenedor.querySelector('img');
  const step = 0;
  const nombreImagen = lista[step].replace(/^.*\//, '');
  img.src = `${ruta}/imagenes/${nombreImagen}`;

  // Esperar a que cargue completamente
  await new Promise((resolve) => {
    if (img.complete) {
      resolve();
    } else {
      img.onload = () => resolve();
      img.onerror = () => {
        console.warn("❌ No se pudo cargar la imagen inicial");
        resolve();
      };
    }
  });
}

/*-------------------Juego----------------------------*/
function iniciarJuego() {
  document.getElementById("imagen-superpuesta").classList.add("hidden");
  document.getElementById("pantalla-juego").classList.remove("hidden");
  document.getElementById("introduccion-juego").classList.remove("hidden");
  document.getElementById("juego-container").classList.add("hidden");
  playClickSound();
}

async function iniciarJuegoReal() {
  const overlay = document.getElementById("pantalla-transicion");
  playClickSound();
  // Mostrar fundido a negro
  overlay.style.opacity = "1";

  // Esperar a que el fundido esté completamente negro (0.4s)
  await new Promise(resolve => setTimeout(resolve, 400));

  // ⏲️ Ya estando en negro, hacemos el cambio de contenido:
  document.getElementById("introduccion-juego").classList.add("hidden");
  document.getElementById("juego-container").classList.remove("hidden");

  stopWelcomePlayback();
  playClickSound();
  document.getElementById("pantalla-final").classList.add("hidden");

  document.getElementById("juego-imagen").classList.remove("hidden");
  document.getElementById("juego-pregunta").classList.remove("hidden");
  document.getElementById("juego-opciones").classList.remove("hidden");

  // Cargar preguntas
  const response = await fetch("juego/preguntas.json");
  gruposDePreguntas = await response.json();
  const nombresGrupos = Object.keys(gruposDePreguntas);
  const grupoAleatorio = nombresGrupos[Math.floor(Math.random() * nombresGrupos.length)];
  iniciarGrupo(grupoAleatorio);

  sonidoFondo.currentTime = 0;
  sonidoFondo.play();

  // Quitar fundido a negro suavemente
  setTimeout(() => {
    overlay.style.opacity = "0";
  }, 100); // ✅ Empieza a desvanecer después de haber cambiado todo
}

function cerrarJuegoYVolverImagen() {
  document.getElementById("pantalla-juego").classList.add("hidden");
  document.getElementById("imagen-superpuesta").classList.remove("hidden");
  playClickSound();
  // Ocultar pantalla final por si estaba visible
  document.getElementById("pantalla-final").classList.add("hidden");

  // Restaurar elementos de juego
  document.getElementById("juego-imagen").classList.remove("hidden");
  document.getElementById("juego-pregunta").classList.remove("hidden");
  document.getElementById("juego-opciones").classList.remove("hidden");

  // Detener sonido de fondo
  sonidoFondo.pause();
  sonidoFondo.currentTime = 0;
}
function cargarPregunta() {
  const p = preguntasGrupoActual[preguntaActual % preguntasGrupoActual.length];

  const juegoImagen = document.getElementById("juego-imagen");
  const juegoPregunta = document.getElementById("juego-pregunta");
  const opcionesDiv = document.getElementById("juego-opciones");
  const feedback = document.getElementById("juego-feedback");

  // Reset y ocultar
  juegoPregunta.style.opacity = "0";
  opcionesDiv.innerHTML = "";
  feedback.textContent = "";

  // Quitar animaciones previas
  juegoImagen.classList.remove("scale-up-center", "scale-down-center");
  juegoPregunta.classList.remove("scale-up-center");

  // Agregar animación de salida
  juegoImagen.classList.add("scale-down-center");

  // Esperar a que termine la animación de salida (400ms aprox)
  setTimeout(() => {
    // Ocultar imagen visualmente mientras cambia
    juegoImagen.style.opacity = "0";

    // Cambiar imagen
    juegoImagen.src = `juego/imagenes/${p.imagen}`;

    // Cuando la imagen nueva haya cargado:
    juegoImagen.onload = () => {
      // Mostrar con animación de entrada
      juegoImagen.classList.remove("scale-down-center");
      juegoImagen.classList.add("scale-up-center");
      juegoImagen.style.opacity = "1";

      // Mostrar pregunta con pequeña demora
      setTimeout(() => {
        juegoPregunta.textContent = p.pregunta;
        juegoPregunta.classList.add("scale-up-center");
        juegoPregunta.style.opacity = "1";
      }, 200);
    };

    // Crear botones de opciones
    p.opciones.forEach((opcion, i) => {
      const btn = document.createElement("button");
      btn.textContent = opcion;
      btn.className = "opcion-boton";
      btn.style.animationDelay = `${i * 0.8}s`;
      btn.onclick = () => verificarRespuesta(i, p.correcta);
      opcionesDiv.appendChild(btn);
    });
  }, 400); // ⏳ tiempo para que la animación de salida se vea
}


function verificarRespuesta(seleccionada, correcta) {
  const feedback = document.getElementById("juego-feedback");
  const botones = document.querySelectorAll("#juego-opciones button");

  botones.forEach((btn, index) => {
    btn.disabled = true; // Desactiva todos los botones

    if (seleccionada === correcta && index === correcta) {
      btn.classList.add("correcta"); // verde si acertado
    }

    if (index === seleccionada && index !== correcta) {
      btn.classList.add("incorrecta"); // rojo si se equivocó
    }
  });

  if (seleccionada === correcta) {
    respuestasCorrectas++
    feedback.style.color = "green";
    audioCorrecto.currentTime = 0;
    audioCorrecto.play();
  } else {
    feedback.style.color = "red";
    audioIncorrecto.currentTime = 0;
    audioIncorrecto.play();
  }

  setTimeout(() => {
    siguientePregunta();
  }, 1500); // espera 2 segundos
}


function siguientePregunta() {
  preguntaActual++;
  if (preguntaActual >= preguntasGrupoActual.length) {
    mostrarPantallaFinal();
  } else {
    cargarPregunta();
  }
}

function mostrarPantallaFinal() {
  const mensajeExtra = document.getElementById("mensaje-extra");
  mensajeExtra.innerHTML = `Terminaste el QUIZ ✅<br><strong>Respuestas correctas: ${respuestasCorrectas} de ${preguntasGrupoActual.length}</strong>`;
  document.getElementById("juego-imagen").classList.add("hidden");
  document.getElementById("fondo-opciones").classList.add("hidden");
  document.getElementById("juego-pregunta").classList.add("hidden");
  document.getElementById("juego-opciones").classList.add("hidden");
  document.getElementById("pantalla-final").classList.remove("hidden");
  // Limpia feedback en caso de que quedara visible
  document.getElementById("juego-feedback").textContent = "";
}
function cambiarGrupo() {
  const nombresGrupos = Object.keys(gruposDePreguntas);
  const grupoAleatorio = nombresGrupos[Math.floor(Math.random() * nombresGrupos.length)];
  iniciarGrupo(grupoAleatorio);
  playClickSound();
  // Mostrar todo de nuevo
  document.getElementById("fondo-opciones").classList.remove("hidden");
  document.getElementById("juego-imagen").classList.remove("hidden");
  document.getElementById("juego-pregunta").classList.remove("hidden");
  document.getElementById("juego-opciones").classList.remove("hidden");
  document.getElementById("pantalla-final").classList.add("hidden");
}
function iniciarGrupo(nombreGrupo) {
  preguntasGrupoActual = gruposDePreguntas[nombreGrupo];
  preguntaActual = 0;
  respuestasCorrectas = 0;
  cargarPregunta();
}
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    // La pestaña se oculta
    if (!sonidoFondo.paused) {
      estabaReproduciendo = true;
      sonidoFondo.pause();
    } else {
      estabaReproduciendo = false;
    }
  } else {
    // La pestaña vuelve a estar visible
    if (estabaReproduciendo) {
      sonidoFondo.play();
    }
  }
});

/*-------------------Juego----------------------------*/