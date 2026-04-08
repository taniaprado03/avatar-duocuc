import * as faceapi from '@vladmandic/face-api';
import { mockUsers } from '../data/mockUsers';

// ═══════════════════════════════════════════════════
// Facial Recognition Service
// ═══════════════════════════════════════════════════

//   import * as faceapi from 'face-api.js';
//   // o
//   const response = await fetch('https://<region>.api.cognitive.microsoft.com/face/v1.0/detect', {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/octet-stream',
//       'Ocp-Apim-Subscription-Key': AZURE_FACE_KEY
//     },
//     body: imageBlob
//   });

/**
 * Resultado del análisis facial.
 * @typedef {Object} FacialAnalysisResult
 * @property {boolean} matched - Si se encontró coincidencia con un usuario registrado
 * @property {number} confidence - Nivel de confianza del match (0.0 - 1.0)
 * @property {string|null} userId - ID del usuario si hubo match, null si no
 */

/**
 * Inicia la captura de cámara del dispositivo.
 *
 * @returns {Promise<MediaStream>} Stream de video de la cámara
 * @throws {Error} Si no se puede acceder a la cámara
 */
export async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 640 },
                height: { ideal: 480 },
                facingMode: 'user' // Cámara frontal
            },
            audio: false
        });
        return stream;
    } catch (error) {
        console.error('Error al acceder a la cámara:', error);
        throw new Error(
            error.name === 'NotAllowedError'
                ? 'Permiso de cámara denegado. Por favor, permite el acceso a la cámara.'
                : error.name === 'NotFoundError'
                    ? 'No se encontró una cámara en este dispositivo.'
                    : `Error al iniciar la cámara: ${error.message}`
        );
    }
}

/**
 * Detiene todos los tracks de un stream de video.
 *
 * @param {MediaStream|null} stream - Stream a detener
 */
export function stopCamera(stream) {
    if (stream) {
        stream.getTracks().forEach((track) => track.stop());
    }
}

/**
 * Captura un frame del stream de video como Blob (imagen).
 *
 * @param {HTMLVideoElement} videoElement - Elemento video con el stream activo
 * @returns {Promise<Blob|null>} Imagen capturada como Blob, o null si falla
 */
export async function captureFrame(videoElement) {
    if (!videoElement || videoElement.readyState < 2) {
        return null;
    }

    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoElement, 0, 0);

    return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9);
    });
}

/**
 * Analiza un stream de video para reconocimiento facial usando face-api local.
 *
 * @param {HTMLVideoElement} videoElement - Elemento video con el stream activo
 * @returns {Promise<FacialAnalysisResult>} Resultado del análisis facial
 */
export async function analyzeFace(videoElement) {
    if (!videoElement || videoElement.readyState < 2) {
        return { matched: false, confidence: 0, userId: null, userData: null };
    }

    try {
        // 1. Extraer el rostro usando TinyFaceDetector
        const detection = await faceapi.detectSingleFace(
            videoElement,
            new faceapi.TinyFaceDetectorOptions({ inputSize: 128, scoreThreshold: 0.3 })
        ).withFaceLandmarks().withFaceDescriptor();

        if (!detection) {
            return { matched: false, confidence: 0, userId: null, userData: null };
        }

        const descriptor = detection.descriptor;
        console.log("FACIAL DESCRIPTOR EXTRACTED:", Array.from(descriptor));

        // 2. Buscar similitudes contra nuestra "Base de Datos" (mockUsers)
        let bestMatch = null;
        let lowestDistance = 1.0;
        const MATCH_THRESHOLD = 0.45; // Euclidian distance threshold

        for (const user of mockUsers) {
            if (!user.descriptor) continue;

            // Reconstruir descriptor guardado en Float32Array requerido por faceapi
            const savedDescriptor = new Float32Array(user.descriptor);
            const distance = faceapi.euclideanDistance(descriptor, savedDescriptor);

            if (distance < MATCH_THRESHOLD && distance < lowestDistance) {
                lowestDistance = distance;
                bestMatch = user;
            }
        }

        if (bestMatch) {
            return {
                matched: true,
                confidence: 1.0 - lowestDistance,
                userId: bestMatch.id,
                userData: { nombre: bestMatch.nombre, rut: bestMatch.rut, correo: bestMatch.correo }
            };
        }

        // Si hay una cara pero no coincide
        return {
            matched: false,
            confidence: 0,
            userId: null,
            userData: null
        };
    } catch (error) {
        console.error("Error durante validación biométrica:", error);
        return { matched: false, confidence: 0, userId: null, userData: null };
    }
}
