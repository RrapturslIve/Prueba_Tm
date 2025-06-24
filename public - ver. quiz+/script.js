let isAudioPlaying = false;
let activeAudios = [];
let isWelcomePlaying = false;
let welcomeAudio;
let video;
let avatar;
let preguntaActual = 0;

const preguntasJuego = [
  {
    pregunta: "¿En qué siglo fue construido el museo?",
    imagen: "qz1.jpg",
    opciones: ["Siglo XVIII", "Siglo XIX", "Siglo XX"],
    correcta: 1
  },
  {
    pregunta: "¿Qué obra pertenece al arte barroco?",
    imagen: "qz2.jpg",
    opciones: ["La noche estrellada", "El nacimiento de Venus", "Las Meninas"],
    correcta: 2
  },
  {
    pregunta: "¿Qué elemento se usaba en la cerámica precolombina?",
    imagen: "qz3.jpg",
    opciones: ["Plomo", "Oro", "Arcilla"],
    correcta: 2
  }
];


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

  startButton.addEventListener("click", () => {
    welcomeScreen.classList.add("hidden");
    mainUI.classList.remove("hidden");
    playClickSound();
    avatar.classList.add("hidden");
    video.classList.add("playing");
    video.currentTime = 0;
    video.play().catch(err => console.warn("Video bloqueado:", err));

    welcomeAudio.play().catch(err => console.warn("Audio bloqueado:", err));
    isWelcomePlaying = true;

    // Detener video cuando termina el audio
    welcomeAudio.onended = stopWelcomePlayback;
  });
});

function mostrarImagen(index) {
  const items = document.querySelectorAll('.item-galeria');
  const botones = document.querySelectorAll('#galeria-controles button');
  playClickSound();
  items.forEach((item, i) => {
    item.classList.toggle('active', i === index);
  });

  botones.forEach((btn, i) => {
    btn.classList.toggle('active', i === index);
  });
}

function inicializarImagenes() {
  const contenedores = document.querySelectorAll('.imagen-caja');

  contenedores.forEach(contenedor => {
    const index = parseInt(contenedor.dataset.index);
    const img = contenedor.querySelector('img');
    const retro = contenedor.querySelector('.btn-retroceso');
    const avanzar = contenedor.querySelector('.btn-subimg');

    contenedor.dataset.step = 0; // Paso inicial
    const srcInicial = `imagenes/${imagenesPorCaja[index][0]}`;
    img.src = srcInicial;

    // Ocultar botones según el estado inicial
    if (retro) retro.style.display = "none";
    if (avanzar && imagenesPorCaja[index].length <= 1) avanzar.style.display = "none";
  });
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
  const contenedor = button.closest('.imagen-caja');
  const index = parseInt(contenedor.dataset.index);
  const step = parseInt(contenedor.dataset.step);
  const dialogueBox = document.getElementById("dialogue-box");
  playClickSound();
  const audioName = `audio${index + 1}${step > 0 ? `_sub${step}` : ''}`;
  playVideoLoop()
  // Reproducir audio
  const seccion = `seccion_${index + 1}`;
  const audio = new Audio(`audios/${seccion}/${audioName}.mp3`);
  audio.play();

  // Cargar mensaje desde archivo
  fetch(`mensajes/${seccion}/${audioName}.txt`)
    .then(res => res.text())
    .then(text => {
      if (dialogueBox) dialogueBox.textContent = text;
    })
    .catch(() => {
      if (dialogueBox) dialogueBox.textContent = "(Mensaje no disponible)";
    });
}

const imagenesPorCaja = {
  0: ['seccion_1/obra1.jpg', 'seccion_1/obra1_sub1.jpeg', 'seccion_1/obra1_sub2.jpeg'],
  1: ['seccion_2/obra2.jpeg', 'seccion_2/obra2_sub1.jpeg'],
  2: ['seccion_3/obra3.jpg', 'seccion_3/obra3_sub1.jpg']
};

/* cambio de sub imagenes ====================================*/
function cambiarSubimagen(button) {
  const contenedor = button.closest('.imagen-caja');
  const index = parseInt(contenedor.dataset.index);
  let step = parseInt(contenedor.dataset.step);
  const img = contenedor.querySelector('img');
  const retro = contenedor.querySelector('.btn-retroceso');
  const avanzar = contenedor.querySelector('.btn-subimg');
  playClickSound();
  const lista = imagenesPorCaja[index];
  if (step < lista.length - 1) {
    step++;
    img.src = `imagenes/${lista[step]}`;
    contenedor.dataset.step = step;
  }

  retro.style.display = step > 0 ? "block" : "none";
  avanzar.style.display = step >= lista.length - 1 ? "none" : "block";
}

function retrocederSubimagen(button) {
  const contenedor = button.closest('.imagen-caja');
  const index = parseInt(contenedor.dataset.index);
  let step = parseInt(contenedor.dataset.step);
  const img = contenedor.querySelector('img');
  const retro = contenedor.querySelector('.btn-retroceso');
  const avanzar = contenedor.querySelector('.btn-subimg');
  playClickSound();
  if (step > 0) {
    step--;
    img.src = `imagenes/${imagenesPorCaja[index][step]}`;
    contenedor.dataset.step = step;
  }

  retro.style.display = step === 0 ? "none" : "block";
  avanzar.style.display = "block";
}

/* AUDIO Y IMAGENES DE CAJA FINNNN   ==========*/

function mostrarImagenSuperpuesta() {
  document.getElementById("imagen-superpuesta").classList.remove("hidden");
  playClickSound();
}

function cerrarImagenSuperpuesta() {
  document.getElementById("imagen-superpuesta").classList.add("hidden");
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

function iniciarJuego() {
  document.getElementById("imagen-superpuesta").classList.add("hidden");
  document.getElementById("pantalla-juego").classList.remove("hidden");
  preguntaActual = 0;
  cargarPregunta();
}

function cerrarJuegoYVolverImagen() {
  document.getElementById("pantalla-juego").classList.add("hidden");
  document.getElementById("imagen-superpuesta").classList.remove("hidden");
}

function cargarPregunta() {
  const p = preguntasJuego[preguntaActual % preguntasJuego.length];

  document.getElementById("juego-imagen").src = p.imagen;
  document.getElementById("juego-pregunta").textContent = p.pregunta;

  const opcionesDiv = document.getElementById("juego-opciones");
  opcionesDiv.innerHTML = "";

  p.opciones.forEach((opcion, i) => {
    const btn = document.createElement("button");
    btn.textContent = opcion;
    btn.className = "opcion-boton";
    btn.onclick = () => verificarRespuesta(i, p.correcta);
    opcionesDiv.appendChild(btn);
  });

  document.getElementById("juego-feedback").textContent = "";
}

function verificarRespuesta(seleccionada, correcta) {
  const feedback = document.getElementById("juego-feedback");
  if (seleccionada === correcta) {
    feedback.textContent = "¡Correcto!";
    feedback.style.color = "green";
  } else {
    feedback.textContent = "Incorrecto, intenta de nuevo.";
    feedback.style.color = "red";
  }

  preguntaActual++;
}
