// ═══════════════════════════════════════════════════
// Biometric Service Adapter
// Punto de entrada para autenticación biométrica.
// Soporta múltiples modos: SIMULATED, FACIAL, DUOC_API
// ═══════════════════════════════════════════════════

// TODO: reemplazar con SDK de reconocimiento facial real
// cuando se integre con Azure Face API, AWS Rekognition,
// o el sistema biométrico propio de DUOC UC.

/**
 * Modo de autenticación biométrica actual.
 * - 'SIMULATED': Botones manuales Éxito/Fallar (desarrollo/demo)
 * - 'FACIAL': Reconocimiento facial vía cámara del dispositivo
 * - 'DUOC_API': API institucional de DUOC UC (futura integración)
 */
export const BIOMETRIC_MODE = 'SIMULATED';

/**
 * Resultado de autenticación biométrica.
 * @typedef {Object} BiometricResult
 * @property {boolean} success - Si la autenticación fue exitosa
 * @property {string|null} userId - ID del usuario autenticado, o null si falló
 * @property {number} [confidence] - Nivel de confianza (0-1), solo en modo FACIAL
 * @property {string} mode - Modo usado para la autenticación
 */

/**
 * Autentica al usuario usando el modo biométrico especificado.
 *
 * @param {string} [mode=BIOMETRIC_MODE] - Modo de autenticación a usar
 * @returns {Promise<BiometricResult>} Resultado de la autenticación
 *
 * En modo SIMULATED, esta función NO se llama directamente.
 * Los botones Éxito/Fallar en BiometricLogin.jsx manejan la lógica.
 * Esta función existe como adapter para modos FACIAL y DUOC_API.
 */
export async function authenticate(mode = BIOMETRIC_MODE) {
    switch (mode) {
        case 'SIMULATED':
            // En modo simulado, la autenticación se maneja con botones en la UI.
            // Retornar estructura por consistencia.
            return {
                success: false,
                userId: null,
                mode: 'SIMULATED'
            };

        case 'FACIAL':
            // TODO: integrar con facialRecognitionService.js
            // const { analyzeFace } = await import('./facialRecognitionService.js');
            // const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            // const result = await analyzeFace(stream);
            // return {
            //   success: result.matched && result.confidence >= 0.85,
            //   userId: result.userId,
            //   confidence: result.confidence,
            //   mode: 'FACIAL'
            // };
            return {
                success: false,
                userId: null,
                confidence: 0,
                mode: 'FACIAL'
            };

        case 'DUOC_API':
            // TODO: integrar con API institucional de DUOC UC
            // const response = await fetch('https://api.duocuc.cl/biometrics/verify', { ... });
            // const data = await response.json();
            // return {
            //   success: data.verified,
            //   userId: data.studentId,
            //   mode: 'DUOC_API'
            // };
            return {
                success: false,
                userId: null,
                mode: 'DUOC_API'
            };

        default:
            console.error(`Modo biométrico desconocido: ${mode}`);
            return {
                success: false,
                userId: null,
                mode
            };
    }
}
