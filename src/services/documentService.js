/**
 * Servicio para conectarse al Gestor Documental (IdeaInMotion).
 */

// Usamos un proxy relativo para evadir bloqueos de CORS del navegador
const API_BASE_URL = '/api/ideainmotion';

/**
 * Limpia un RUT eliminando puntos y guiones para que quede en formato limpio.
 * @param {string} rut - El RUT crudo, ej "12.345.678-9" o "12345678-9".
 * @returns {string} RUT limpio, ej "123456789".
 */
const cleanRut = (rut) => {
    if (!rut) return '';
    return rut.replace(/[\.\-]/g, '').trim();
};

/**
 * Solicita el PDF en base64 según el trámite.
 * @param {number} tramiteId - ID del trámite seleccionado (1 = certificado, 2 = horario)
 * @param {string} rawRut - RUT del alumno.
 * @returns {Promise<{success: boolean, base64?: string, error?: string}>}
 */
export const fetchDocumentBase64 = async (tramiteId, rawRut) => {
    try {
        const rut = cleanRut(rawRut);
        
        let tipoEndpoint = '';
        if (tramiteId === 1) {
            tipoEndpoint = 'schedule';
        } else if (tramiteId === 2) {
            tipoEndpoint = 'certificate';
        } else {
            throw new Error("Tipo de trámite no soportado para documentos online.");
        }

        const url = `${API_BASE_URL}/documento/${tipoEndpoint}/${rut}`;
        console.log(`[DocumentService] Pidiendo ${tipoEndpoint} para RUT ${rut}...`);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        const data = await response.json();

        if (response.ok && data.success && data.base64) {
            console.log(`[DocumentService] PDF descargado, largo Base64: ${data.base64.length}`);
            return {
                success: true,
                base64: data.base64
            };
        } else {
            console.warn("[DocumentService] Error en data:", data);

            return {
                success: false,
                error: data.message || "Documento no encontrado o no disponible."
            };
        }
    } catch (error) {
        console.error("[DocumentService] Error de red:", error);
        return {
            success: false,
            error: "Error de conexión con el gestor documental."
        };
    }
};
