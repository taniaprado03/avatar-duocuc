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

    // Función auxiliar para generar ticket fallback siempre que se necesite
    function generarFallback(razon) {
        const num = Math.floor(Math.random() * 900) + 100;
        const fallbackTicket = `${areaPrefix}-${num}`;
        console.warn(`[TicketService] Fallback (${razon}):`, fallbackTicket);
        return { success: true, ticketNumber: fallbackTicket, fallback: true };
    }

    try {
        console.log(`[TicketService] Creando ticket: ${nombre} (${rut}) - ${motivo}`);

        const response = await fetch(`${TICKET_API_BASE}/crear_ticket.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rut, nombre, motivo })
        });

        const data = await response.json();

        if (response.ok && data.success && data.ticketNumber) {
            console.log(`[TicketService] ✅ Ticket creado en BD: ${data.ticketNumber}`);
            return {
                success: true,
                ticketNumber: data.ticketNumber,
                ticketId: data.ticketId
            };
        } else {
            // El servidor respondió pero con error → fallback con número visible
            console.warn('[TicketService] Servidor respondió con error:', data);
            return generarFallback('respuesta-servidor-error');
        }
    } catch (error) {
        // Red caída o servidor no disponible → fallback con número visible
        return generarFallback('error-de-red');
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
