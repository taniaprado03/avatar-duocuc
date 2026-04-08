/**
 * Email Service — Envío de correos vía servidor PHP (cittsb.cl)
 * 
 * Todos los correos se envían a través del servidor PHP propio,
 * eliminando la dependencia de EmailJS.
 */

const EMAIL_API_BASE = '/api/tickets';

/**
 * Envía el certificado con PDF adjunto por correo.
 * @param {Object} userData - Datos del alumno { nombre, correo }
 * @param {string} base64Pdf - PDF en base64
 */
export async function sendCertificadoEmail(userData, base64Pdf) {
    if (!userData || !userData.correo) return false;

    try {
        console.log(`Enviando Certificado a: ${userData.correo}`);

        const response = await fetch(`${EMAIL_API_BASE}/enviar_documento.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to_email: userData.correo,
                to_name: userData.nombre,
                documento: 'Certificado de Alumno Regular',
                base64: base64Pdf || ''
            })
        });

        const result = await response.json();
        if (result.success) {
            console.log("✅ Certificado enviado con PDF adjunto");
            return true;
        } else {
            console.error("❌ Error servidor:", result.message);
            return false;
        }
    } catch (error) {
        console.error("❌ Error enviando certificado:", error);
        return false;
    }
}

/**
 * Envía el horario con PDF adjunto por correo.
 * @param {Object} userData - Datos del alumno { nombre, correo }
 * @param {string} base64Pdf - PDF en base64
 */
export async function sendHorarioEmail(userData, base64Pdf) {
    if (!userData || !userData.correo) return false;

    try {
        console.log(`Enviando Horario a: ${userData.correo}`);

        const response = await fetch(`${EMAIL_API_BASE}/enviar_documento.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to_email: userData.correo,
                to_name: userData.nombre,
                documento: 'Horario de Clases',
                base64: base64Pdf || ''
            })
        });

        const result = await response.json();
        if (result.success) {
            console.log("✅ Horario enviado con PDF adjunto");
            return true;
        } else {
            console.error("❌ Error servidor:", result.message);
            return false;
        }
    } catch (error) {
        console.error("❌ Error enviando horario:", error);
        return false;
    }
}

/**
 * Envía el ticket de atención por correo.
 * @param {Object} userData - Datos del alumno { nombre, correo }
 * @param {string} ticketNumber - Número del ticket (ej: "ACA-015")
 */
export async function sendTicketEmail(userData, ticketNumber) {
    if (!userData || !userData.correo) return false;

    try {
        console.log(`Enviando Ticket ${ticketNumber} a: ${userData.correo}`);

        // Extraer área del prefijo del ticket
        const areaMap = { 'ACA': 'Académico', 'PRA': 'Práctica y Título', 'INC': 'Inclusión', 'FIN': 'Financiero', 'ASE': 'General' };
        const prefix = ticketNumber.split('-')[0] || 'ASE';
        const area = areaMap[prefix] || 'General';

        const response = await fetch(`${EMAIL_API_BASE}/enviar_ticket.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to_email: userData.correo,
                to_name: userData.nombre,
                ticket: ticketNumber,
                area: area
            })
        });

        const result = await response.json();
        if (result.success) {
            console.log("✅ Ticket enviado por correo");
            return true;
        } else {
            console.error("❌ Error servidor:", result.message);
            return false;
        }
    } catch (error) {
        console.error("❌ Error enviando ticket:", error);
        return false;
    }
}

/**
 * Envía información financiera por correo.
 * @param {Object} userData - Datos del alumno { nombre, correo }
 */
export async function sendFinancieroEmail(userData) {
    if (!userData || !userData.correo) return false;

    try {
        console.log(`Enviando Situación Financiera a: ${userData.correo}`);

        const response = await fetch(`${EMAIL_API_BASE}/enviar_documento.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to_email: userData.correo,
                to_name: userData.nombre,
                documento: 'Estado de Situación Financiera',
                base64: ''
            })
        });

        const result = await response.json();
        if (result.success) {
            console.log("✅ Info financiera enviada");
            return true;
        }
        return false;
    } catch (error) {
        console.error("❌ Error enviando correo financiero:", error);
        return false;
    }
}
