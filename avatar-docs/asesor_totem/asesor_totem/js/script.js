let miMesa = null;
let estoyOcupado = false;

function iniciarSesion() {
    miMesa = document.getElementById('mesaSelector').value;
    document.getElementById('labelMesa').innerText = "ASESOR - MESA " + miMesa;
    document.getElementById('setup').style.display = "none";
    document.getElementById('mainPanel').style.display = "block";

    cargarTickets();
    setInterval(cargarTickets, 2000); // Actualizar cada 2 seg
}

async function cargarTickets() {
    try {
        // Pide los datos a la base de datos (api_turnos.php)
        const response = await fetch('api_turnos.php');
        const data = await response.json();

        const lista = document.getElementById('listaEspera');
        const area = document.getElementById('areaAtencion');
        const otrosList = document.getElementById('otrosAsesoresList');

        lista.innerHTML = "";
        otrosList.innerHTML = "";

        // Separar llamados: MIO vs OTROS
        let miTicket = null;
        let otrosTickets = [];

        if (data.llamados && Array.isArray(data.llamados)) {
            data.llamados.forEach(ticket => {
                if (ticket.mesa == miMesa) {
                    miTicket = ticket;
                } else {
                    otrosTickets.push(ticket);
                }
            });
        }

        // 1. ¿ESTOY ATENDIENDO A ALGUIEN?
        if (miTicket) {
            estoyOcupado = true;
            area.innerHTML = `
                <div style="color:#666;">ATENDIENDO AHORA:</div>
                <div class="big-ticket">${miTicket.rut}</div>
                <h3>${miTicket.nombre}</h3>
                <p>${miTicket.motivo}</p>
                <button class="btn-finish" onclick="finalizar(${miTicket.id})">Finalizar Atención</button>
            `;
        } else {
            estoyOcupado = false;
            area.innerHTML = `<p style="color:#999; font-size:1.5rem;">Mesa Disponible.<br>Llama a un alumno.</p>`;
        }

        // 2. MOSTRAR LISTA DE OTROS ASESORES
        if (otrosTickets.length > 0) {
            otrosTickets.forEach(t => {
                otrosList.innerHTML += `
                    <div class="advisor-card">
                        <span class="advisor-badge">Mesa ${t.mesa}</span>
                        <div><strong>${t.rut}</strong> - ${t.nombre}</div>
                    </div>
                `;
            });
        } else {
            otrosList.innerHTML = "<p style='color:#999; font-size:0.9rem;'>Nadie más está atendiendo.</p>";
        }

        // 3. MOSTRAR LISTA DE ESPERA
        if (data.espera.length > 0) {
            data.espera.forEach(t => {
                const disabled = estoyOcupado ? 'disabled' : '';
                lista.innerHTML += `
                    <div class="ticket-card">
                        <div><strong>${t.rut}</strong><br><small>${t.nombre}</small></div>
                        <button class="btn-call" ${disabled} onclick="llamar(${t.id})">Llamar</button>
                    </div>
                `;
            });
        } else {
            lista.innerHTML = "<p style='text-align:center; color:#999;'>No hay alumnos esperando.</p>";
        }

    } catch (error) { console.error(error); }
}

// LLAMAR A UN ALUMNO
async function llamar(id) {
    if (estoyOcupado) return;
    await fetch('gestionar_ticket.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'llamar', id: id, mesa: miMesa })
    });
    cargarTickets();
}

// FINALIZAR ATENCIÓN
async function finalizar(id) {
    if (!confirm("¿Terminar atención?")) return;
    await fetch('gestionar_ticket.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'finalizar', id: id })
    });
    cargarTickets();
}
