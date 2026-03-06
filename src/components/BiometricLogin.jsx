import { useEffect, useRef, useState } from 'react';
import { startCamera, stopCamera, analyzeFace } from '../services/facialRecognitionService';
import { BIOMETRIC_MODE } from '../services/biometricService';
import { Camera, CheckCircle, XCircle, AlertTriangle, ShieldCheck, UserX } from 'lucide-react';

function CameraPreview({ onFaceMatched }) {
    const videoRef = useRef(null);
    const [cameraError, setCameraError] = useState(null);
    const [cameraReady, setCameraReady] = useState(false);
    const streamRef = useRef(null);

    useEffect(() => {
        let cancelled = false;
        async function initCamera() {
            try {
                const stream = await startCamera();
                if (cancelled) { stopCamera(stream); return; }
                streamRef.current = stream;
                if (videoRef.current) videoRef.current.srcObject = stream;
                setCameraReady(true);
            } catch (error) {
                if (!cancelled) setCameraError(error.message);
            }
        }
        initCamera();
        return () => { cancelled = true; stopCamera(streamRef.current); streamRef.current = null; };
    }, []);

    useEffect(() => {
        if (!cameraReady) return;
        let cancelled = false;

        const checkFace = async () => {
            if (cancelled || !videoRef.current) return;
            const result = await analyzeFace(videoRef.current);
            if (result.matched && result.userData) {
                console.log("¡Rostro verificado exitosamente!", result.userData);
                onFaceMatched(result.userData);
            } else {
                if (!cancelled) setTimeout(checkFace, 1500);
            }
        };

        checkFace();
        return () => { cancelled = true; };
    }, [cameraReady, onFaceMatched]);

    if (cameraError) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-red-500/10 border border-red-500/30 rounded-3xl text-center w-full max-w-sm mx-auto">
                <div className="text-red-400 mb-2"><Camera size={48} /></div>
                <p className="text-red-300 text-sm">{cameraError}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center w-full max-w-sm mx-auto">
            <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden bg-gray-100 border-2 border-gray-300 shadow-md mb-4">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover -scale-x-100" />

                {/* Scanner Overlay */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-[8%]">
                        <span className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-duoc-yellow rounded-tl-xl" />
                        <span className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-duoc-yellow rounded-tr-xl" />
                        <span className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-duoc-yellow rounded-bl-xl" />
                        <span className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-duoc-yellow rounded-br-xl" />
                    </div>
                    <div className="absolute left-[10%] right-[10%] h-[2px] bg-gradient-to-r from-transparent via-duoc-yellow to-transparent top-[15%] animate-[scanLine_2.5s_ease-in-out_infinite]" />
                </div>

                {!cameraReady && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm text-gray-500 text-sm font-medium">
                        <span>Iniciando cámara...</span>
                    </div>
                )}
            </div>
            <p className="text-duoc-blue text-lg font-medium text-center drop-shadow-sm">Mira a la cámara para validar tu identidad</p>
        </div>
    );
}

export default function BiometricLogin({ onSuccess, onFail, reintentosBio, showAsesorPrompt, onAsesorYes, onAsesorNo, modoAccesible }) {
    if (showAsesorPrompt) {
        return (
            <div className="flex flex-col items-center justify-center w-full max-w-lg bg-white border border-red-200 rounded-3xl p-8 sm:p-10 shadow-lg text-center mx-auto">
                <div className="text-red-500 mb-4 drop-shadow-sm"><UserX size={48} /></div>
                <h2 className="text-3xl font-black text-duoc-blue mb-2">Verificación no exitosa</h2>
                <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                    No hemos podido verificar tu identidad después de {reintentosBio} intentos.
                </p>
                <p className="text-gray-800 font-medium mb-8">¿Deseas ser derivado a un asesor presencial?</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                    <button className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 text-white font-bold text-lg hover:scale-105 transition-transform shadow-[0_8px_25px_rgba(74,222,128,0.3)]" onClick={onAsesorYes}>
                        <CheckCircle size={22} /> Sí, derivar a asesor
                    </button>
                    <button className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white border border-gray-300 text-gray-700 font-semibold text-lg hover:bg-gray-50 transition-colors shadow-sm" onClick={onAsesorNo}>
                        <XCircle size={22} /> No, salir
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center w-full max-w-3xl mx-auto">
            <CameraPreview onFaceMatched={(userData) => {
                /* Delay to simulate API overhead vs UI */
                setTimeout(() => onSuccess(userData), 800)
            }} />

            {reintentosBio > 0 && (
                <div className="mt-6 flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 px-6 py-3 rounded-full text-sm font-medium w-fit mx-auto">
                    <AlertTriangle size={18} />
                    <span>Intento {reintentosBio + 1} de 2 — Inténtalo de nuevo</span>
                </div>
            )}

            <div className="mt-8 pt-6 border-t border-gray-200 w-full max-w-sm mx-auto">
                <div className="flex items-center justify-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">
                    <ShieldCheck size={14} /> Simulación ({BIOMETRIC_MODE})
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <button className="flex justify-center items-center gap-2 py-3 bg-green-500/20 text-green-400 border border-green-500/30 rounded-xl font-semibold text-sm hover:bg-green-500/30 transition-colors" onClick={onSuccess}>
                        <CheckCircle size={16} /> Éxito
                    </button>
                    <button className="flex justify-center items-center gap-2 py-3 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-semibold text-sm hover:bg-red-500/30 transition-colors" onClick={onFail}>
                        <XCircle size={16} /> Fallar
                    </button>
                </div>
            </div>
        </div>
    );
}
