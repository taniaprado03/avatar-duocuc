/**
 * Servicio de Tickets — Integración con el sistema de turnos GLPI (cittsb.cl)
 * 
 * Crea tickets en el backend PHP/SQLite para que aparezcan en:
 * - Panel del Asesor (asesor.php)
 * - Pantalla de Espera (pantalla.php)
 */

const TICKET_API_BASE = '/api/tickets';

/**
 * Mapea el ID de área del tótem al nombre de motivo del backend.
 */
const AREA_TO_MOTIVO = {
    'ACA': 'Académico',
    'PRA': 'Práctica y Título',
    'INC': 'Inclusión',
    'FIN': 'Financiero',
};

/**
 * Crea un ticket de atención en el sistema de turnos.
 * 
 * @param {string} rut - RUT del alumno
 * @param {string} nombre - Nombre del alumno
 * @param {string} areaPrefix - Prefijo del área (ACA, PRA, INC, FIN)
 * @returns {Promise<{success: boolean, ticketNumber?: string, error?: string}>}
 */
export async function createTicket(rut, nombre, areaPrefix) {
    const motivo = AREA_TO_MOTIVO[areaPrefix] || 'Consulta General';

    try {
        console.log(`[TicketService] Creando ticket: ${nombre} (${rut}) - ${motivo}`);

        const response = await fetch(`${TICKET_API_BASE}/crear_ticket.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rut, nombre, motivo })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            console.log(`[TicketService] Ticket creado: ${data.ticketNumber}`);
            return {
                success: true,
                ticketNumber: data.ticketNumber,
                ticketId: data.ticketId
            };
        } else {
            console.warn('[TicketService] Error del servidor:', data);
            return {
                success: false,
                error: data.message || 'Error al crear ticket'
            };
        }
    } catch (error) {
        console.error('[TicketService] Error de red:', error);
        // Fallback: generar ticket local si el servidor no responde
        const num = Math.floor(Math.random() * 900) + 100;
        const fallbackTicket = `${areaPrefix}-${num}`;
        console.log(`[TicketService] Usando fallback local: ${fallbackTicket}`);
        return {
            success: true,
            ticketNumber: fallbackTicket,
            fallback: true
        };
    }
}

/**
 * Obtiene la cola de espera actual.
 * 
 * @returns {Promise<{espera: Array, llamados: Array}>}
 */
export async function getQueue() {
    try {
        const response = await fetch(`${TICKET_API_BASE}/api_turnos.php`);
        return await response.json();
    } catch (error) {
        console.error('[TicketService] Error obteniendo cola:', error);
        return { espera: [], llamados: [] };
    }
}
