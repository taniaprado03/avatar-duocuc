// ═══════════════════════════════════════════════════
// Presence Service
// Detección automática de rostro usando face-api.js
// TinyFaceDetector para rendimiento ligero
// ═══════════════════════════════════════════════════

import * as faceapi from '@vladmandic/face-api';

let detectionInterval = null;
let modelsLoaded = false;
let modelsLoading = false;

/**
 * Carga los modelos de TinyFaceDetector desde /models/
 * @returns {Promise<boolean>} true si los modelos se cargaron correctamente
 */
export async function loadModels() {
    if (modelsLoaded) return true;
    if (modelsLoading) {
        // Wait for current load to finish
        return new Promise((resolve) => {
            const check = setInterval(() => {
                if (modelsLoaded || !modelsLoading) {
                    clearInterval(check);
                    resolve(modelsLoaded);
                }
            }, 200);
        });
    }

    modelsLoading = true;
    try {
        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
            faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
            faceapi.nets.faceRecognitionNet.loadFromUri('/models')
        ]);
        modelsLoaded = true;
        console.log('✅ Face detection and recognition models loaded');
        return true;
    } catch (error) {
        console.error('❌ Error loading face models:', error);
        modelsLoaded = false;
        return false;
    } finally {
        modelsLoading = false;
    }
}

/**
 * Inicia la detección continua de rostro en un elemento <video>.
 * Detecta cada 800ms para no sobrecargar. Cuando detecta un rostro
 * con confidence > 0.7, llama onFaceDetected y se detiene automáticamente.
 *
 * @param {HTMLVideoElement} videoElement - Elemento video con stream de cámara activo
 * @param {Function} onFaceDetected - Callback al detectar rostro
 */
export function startDetection(videoElement, onFaceDetected) {
    if (!modelsLoaded || !videoElement) {
        console.warn('Cannot start detection: models not loaded or no video element');
        return;
    }

    stopDetection(); // Clear any previous loop

    const options = new faceapi.TinyFaceDetectorOptions({
        inputSize: 224,
        scoreThreshold: 0.7
    });

    detectionInterval = setInterval(async () => {
        if (!videoElement || videoElement.readyState < 2) return;

        try {
            const detection = await faceapi.detectSingleFace(videoElement, options);

            if (detection && detection.score > 0.7) {
                console.log(`🧑 Face detected (confidence: ${(detection.score * 100).toFixed(1)}%)`);
                stopDetection();
                if (onFaceDetected) {
                    onFaceDetected(detection.score);
                }
            }
        } catch (error) {
            // Silently ignore detection errors (e.g., video not ready)
        }
    }, 800);
}

/**
 * Detiene el loop de detección.
 */
export function stopDetection() {
    if (detectionInterval) {
        clearInterval(detectionInterval);
        detectionInterval = null;
    }
}

/**
 * @returns {boolean} Si los modelos están cargados y listos
 */
export function isReady() {
    return modelsLoaded;
}
