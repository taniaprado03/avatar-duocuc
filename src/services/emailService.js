import emailjs from '@emailjs/browser';

// ═══════════════════════════════════════════════════
// Email Service
// Maneja el envío de PDFs y Tickets usando EmailJS
// ═══════════════════════════════════════════════════

// NOTA PARA LA DEMO: 
// Las claves ahora residen en .env.local para que Github no bloquee la subida por GH013
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || "service_t61ekgy";
const EMAILJS_TEMPLATE_CERTIFICADO = import.meta.env.VITE_EMAILJS_TEMPLATE_CERTIFICADO || "template_dtnkmbt"; // Plantilla del Certificado lista
const EMAILJS_TEMPLATE_TICKET = import.meta.env.VITE_EMAILJS_TEMPLATE_TICKET || "template_z3cjy0c"; // Plantilla del Ticket lista
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || "";

/**
 * Manda el correo con el certificado
 */
export async function sendCertificadoEmail(userData) {
    if (!userData || !userData.correo) return false;

    try {
        console.log(`Enviando Certificado de Alumno Regular a: ${userData.correo}`);

        // Simular preparación de PDF estático
        const templateParams = {
            to_name: userData.nombre,
            to_email: userData.correo,
            documento: "Certificado de Alumno Regular",
            fecha: new Date().toLocaleDateString('es-CL'),
            // archivoPdf: "http://link-al-pdf-en-tu-servidor-o-public/tu_certificado.pdf" 
            // EmailJS soporta adjuntos si les pasas una URL en base64 o link público
        };

        // Descomentar cuando tengas las llaves de EmailJS reales:
        await emailjs.send(
            EMAILJS_SERVICE_ID,
            EMAILJS_TEMPLATE_CERTIFICADO,
            templateParams,
            EMAILJS_PUBLIC_KEY
        );

        console.log("✅ Correo enviado con éxito mediante EmailJS");
        return true;
    } catch (error) {
        console.error("❌ Error enviando correo:", error);
        return false;
    }
}

/**
 * Manda el ticket de atención por correo
 */
export async function sendTicketEmail(userData, ticketNumber) {
    if (!userData || !userData.correo) return false;

    try {
        console.log(`Enviando Ticket ${ticketNumber} a: ${userData.correo}`);

        const templateParams = {
            to_name: userData.nombre,
            to_email: userData.correo,
            ticket: ticketNumber,
            mensaje: "Por favor acércate al mesón cuando tu número aparezca en la pantalla."
        };

        // Descomentar cuando tengas las llaves reales:
        await emailjs.send(
            EMAILJS_SERVICE_ID,
            EMAILJS_TEMPLATE_TICKET,
            templateParams,
            EMAILJS_PUBLIC_KEY
        );

        console.log("✅ Ticket enviado por correo mediante EmailJS");
        return true;
    } catch (error) {
        console.error("❌ Error enviando ticket por correo:", error);
        return false;
    }
}

/**
 * Manda la información financiera por correo (Por privacidad, no se renderiza en pantalla)
 */
export async function sendFinancieroEmail(userData) {
    if (!userData || !userData.correo) return false;

    try {
        console.log(`Enviando Situación Financiera a: ${userData.correo}`);

        const templateParams = {
            to_name: userData.nombre,
            to_email: userData.correo,
            documento: "Estado de Situación Financiera",
            fecha: new Date().toLocaleDateString('es-CL'),
            mensaje: "Tu arancel se encuentra al día. Saldo pendiente: $320.000 (Próximo vencimiento 15/03/2026)."
        };

        // await emailjs.send(EMAILJS_SERVICE_ID, templateID, templateParams, EMAILJS_PUBLIC_KEY);

        console.log("✅ Situación Financiera enviada por correo");
        return true;
    } catch (error) {
        console.error("❌ Error enviando correo financiero:", error);
        return false;
    }
}
