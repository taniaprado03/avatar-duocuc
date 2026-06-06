const firebaseConfig = {
    apiKey: "AIzaSyDIhEkRwAkc3UYsAo1MdMOA057lkHZRRe4",
    authDomain: "totem-duoc-sb.firebaseapp.com",
    projectId: "totem-duoc-sb",
    databaseURL: "https://totem-duoc-sb-default-rtdb.firebaseio.com"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Control de voz
let vozActivada = false;

function activarVoz() {
    const btn = document.getElementById('status-voz');
    const icono = document.getElementById('icono-voz');
    const texto = document.getElementById('texto-voz');

    if (!vozActivada) {
        // ACTIVAR
        vozActivada = true;
        btn.style.background = "#28a745"; // Verde (Activado)
        icono.innerText = "🔊";
        texto.innerText = "VOZ ACTIVADA";
        
        // Prueba de confirmación inmediata
        const bienvenida = new SpeechSynthesisUtterance("Buen día, la voz ha sido activada.");
        bienvenida.lang = 'es-ES';
        window.speechSynthesis.speak(bienvenida);
    } else {
        // DESACTIVAR
        vozActivada = false;
        btn.style.background = "#cc0000"; // Rojo (Desactivado)
        icono.innerText = "🎤";
        texto.innerText = "VOZ DESACTIVADA";
        window.speechSynthesis.cancel(); // Detener cualquier llamado en curso
    }
}

// Variable para recordar el último ticket y no repetir la voz mil veces
let idTicketAnterior = ""; 

db.ref('tickets').on('value', (snapshot) => {
    const data = snapshot.val();
    const currentTicketUI = document.getElementById('currentTicket');
    const currentMesaUI = document.getElementById('currentMesa');
    const historyList = document.getElementById('historyList');

    if (!data) {
        currentTicketUI.innerText = "--";
        currentMesaUI.innerText = "ESPERANDO";
        historyList.innerHTML = "";
        return;
    }

    let ticketsAtendiendo = [];
    let ticketsFinalizados = [];

    Object.keys(data).forEach(key => {
        const t = { id: key, ...data[key] };
        if (t.estado === "atendiendo") {
            ticketsAtendiendo.push(t);
        } else if (t.estado === "finalizado") {
            ticketsFinalizados.push(t);
        }
    });

    // LLAMADO ACTUAL (CENTRO)
    if (ticketsAtendiendo.length > 0) {
        // Ordenamos por el llamado más reciente
        ticketsAtendiendo.sort((a, b) => b.timestamp - a.timestamp);
        const actual = ticketsAtendiendo[0];

        // ACTUALIZAR PANTALLA
        currentTicketUI.innerText = actual.numero;
        currentMesaUI.innerText = "MESA " + actual.mesa;

        // VERIFICAR SI DEBEMOS HABLAR (Solo si el ID cambió)
        if (actual.id !== idTicketAnterior) {
            console.log("Nuevo llamado detectado:", actual.numero);
            
            // 1. Sonido Ding
            const audio = document.getElementById('ding');
            if(audio) audio.play().catch(e => console.log("Esperando click del usuario"));

            // 2. Voz
            llamarPorVoz(actual.numero, actual.mesa);

            // Guardamos el ID para que no vuelva a hablar hasta el próximo ticket
            idTicketAnterior = actual.id;
        }
    } else {
        currentTicketUI.innerText = "--";
        currentMesaUI.innerText = "ESPERANDO";
        idTicketAnterior = ""; // Reiniciamos si no hay nadie
    }

    // HISTORIAL (DERECHA) - Mostrar los últimos finalizados
    ticketsFinalizados.sort((a, b) => b.timestamp - a.timestamp);
    historyList.innerHTML = "";
    ticketsFinalizados.slice(0, 5).forEach(t => {
        historyList.innerHTML += `
            <div class="history-item" style="display:flex; justify-content:space-between; font-size:35px; margin-bottom:10px;">
                <span style="color:#FFB800;">${t.numero}</span>
                <span style="color:white; font-size:25px;">MESA ${t.mesa}</span>
            </div>`;
    });
});

function llamarPorVoz(numero, mesa) {
    if (!vozActivada) return; // Si no han dado click al micro, no hace niuna cuestion 

    // Cancelamos cualquier voz previa para que no se amontonen
    window.speechSynthesis.cancel();

    const texto = `Número ${numero.split('').join(' ')}, diríjase a la mesa ${mesa}`;
    const mensaje = new SpeechSynthesisUtterance(texto);
    
    mensaje.lang = 'es-ES';
    mensaje.rate = 0.8; // Velocidad pausada
    mensaje.volume = 1;

    // Ejecutar voz
    window.speechSynthesis.speak(mensaje);
}

// Reloj y Fecha en tiempo real
function actualizarTiempo() {
    const ahora = new Date();
    
    // Configuración del Reloj
    const horas = ahora.getHours().toString().padStart(2, '0');
    const minutos = ahora.getMinutes().toString().padStart(2, '0');
    const segundos = ahora.getSeconds().toString().padStart(2, '0');
    document.getElementById('reloj').innerText = `${horas}:${minutos}:${segundos}`;

    // Configuración de la Fecha (Ejemplo: que te importa)
    const opciones = { weekday: 'long', day: 'numeric', month: 'long' };
    const fechaTexto = ahora.toLocaleDateString('es-ES', opciones);
    document.getElementById('fecha').innerText = fechaTexto;
}

// Actualizar cada segundo
setInterval(actualizarTiempo, 1000);
actualizarTiempo();
