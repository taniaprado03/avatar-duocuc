import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Registra una interacción del alumno en Firestore para analíticas (Fase 1).
 * @param {string} type - Tipo de evento ('TRAMITE' o 'ASESOR')
 * @param {string} detail - Opción seleccionada ('Académico', 'Financiero', etc.)
 * @param {string} userRut - RUT del alumno (Por defecto 'Anónimo' en MVP)
 */
export async function logInteraction(type, detail, userRut = 'Anónimo') {
    try {
        await addDoc(collection(db, 'totem_analiticas'), {
            tipo: type,
            detalle: detail,
            rut: userRut,
            fecha: serverTimestamp(),
            dispositivo: 'Tótem San Bernardo 01'
        });
        console.log(`[Cloud Analytics] Guardado exitoso: ${type} -> ${detail}`);
    } catch (e) {
        console.error("[Cloud Analytics] Error comunicando con la nube: ", e);
    }
}
