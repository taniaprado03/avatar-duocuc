import { useEffect, useRef, useState } from 'react';
import { startCamera, stopCamera, analyzeFace } from '../services/facialRecognitionService';
import { BIOMETRIC_MODE } from '../services/biometricService';
import { Camera, CheckCircle, XCircle, AlertTriangle, ShieldCheck, UserX } from 'lucide-react';

function CameraPreview({ onFaceMatched, onFail, inputMode }) {
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
        let timeoutId;

        const checkFace = async () => {
            if (cancelled || !videoRef.current) return;
            const result = await analyzeFace(videoRef.current);
            if (result.matched && result.userData) {
                console.log("¡Rostro verificado exitosamente!", result.userData);
                clearTimeout(timeoutId);
                onFaceMatched(result.userData);
            } else {
                if (!cancelled) setTimeout(checkFace, 200);
            }
        };

        checkFace();

        // Si no se encuentra rostro en 10 segundos, lanzar el evento de fallo para que se reproduzca el video
        timeoutId = setTimeout(() => {
            if (!cancelled) {
                cancelled = true;
                onFail();
            }
        }, 10000);

        return () => {
            cancelled = true;
            clearTimeout(timeoutId);
        };
    }, [cameraReady, onFaceMatched, onFail]);

    if (cameraError) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-red-500/10 border border-red-500/30 rounded-3xl text-center w-full max-w-sm mx-auto">
                <div className="text-red-400 mb-2"><Camera size={48} /></div>
                <p className="text-red-300 text-sm">{cameraError}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center w-full max-w-md mx-auto relative z-20 mt-16">

            <div className="relative w-80 h-96 rounded-2xl overflow-hidden bg-black/40 backdrop-blur-md border border-white/20 shadow-2xl flex items-center justify-center">
                {/* The actual webcam feed must be present for tf.js but hidden visually */}
                <video ref={videoRef} autoPlay playsInline muted className="absolute opacity-0 pointer-events-none w-[1px] h-[1px]" />

                {/* Aesthetic Scanner Overlay */}
                <div className="absolute inset-x-8 inset-y-12 pointer-events-none flex items-center justify-center">
                    {/* Corner Brackets */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-white/70" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-white/70" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-white/70" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-white/70" />

                    {/* Face Mesh SVG Approximation */}
                    <svg viewBox="0 0 100 120" className="w-32 h-40 opacity-70">
                        {/* Outline */}
                        <path d="M 20 20 L 80 20 L 95 50 L 85 90 L 50 115 L 15 90 L 5 50 Z" fill="none" stroke="white" strokeWidth="1" strokeDasharray="3 3" />
                        {/* Inner network */}
                        <path d="M 50 115 L 50 85 M 15 90 L 35 75 M 85 90 L 65 75 M 20 20 L 35 45 M 80 20 L 65 45 M 50 85 L 35 75 L 50 55 L 65 75 Z M 50 55 L 35 45 L 65 45 Z" fill="none" stroke="white" strokeWidth="0.5" />
                        {/* Nodes */}
                        <circle cx="20" cy="20" r="1.5" fill="white" />
                        <circle cx="80" cy="20" r="1.5" fill="white" />
                        <circle cx="95" cy="50" r="1.5" fill="white" />
                        <circle cx="5" cy="50" r="1.5" fill="white" />
                        <circle cx="15" cy="90" r="1.5" fill="white" />
                        <circle cx="85" cy="90" r="1.5" fill="white" />
                        <circle cx="50" cy="115" r="1.5" fill="white" />
                        <circle cx="50" cy="85" r="1.5" fill="white" />
                        <circle cx="35" cy="75" r="1.5" fill="white" />
                        <circle cx="65" cy="75" r="1.5" fill="white" />
                        <circle cx="50" cy="55" r="1.5" fill="white" />
                        <circle cx="35" cy="45" r="1.5" fill="white" />
                        <circle cx="65" cy="45" r="1.5" fill="white" />
                    </svg>
                </div>

                {/* Animated Scan Line */}
                <div className="absolute left-[10%] right-[10%] h-[2px] bg-white/50 shadow-[0_0_8px_rgba(255,255,255,0.8)] top-[15%] animate-[scanLine_2.5s_ease-in-out_infinite]" />

                {!cameraReady && (
                    <div className="absolute inset-0 flex items-center justify-center bg-transparent backdrop-blur-sm text-white/80 text-sm font-bold">
                        <span>Activando...</span>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function BiometricLogin({ onSuccess, onFail, reintentosBio, showAsesorPrompt, onAsesorYes, onAsesorNo, modoAccesible, inputMode }) {
    if (showAsesorPrompt) {
        return (
            <div className="flex flex-col items-center justify-center w-full max-w-lg bg-white border border-red-200 rounded-3xl p-8 sm:p-10 shadow-lg text-center mx-auto">
                <div className="text-red-500 mb-4 drop-shadow-sm"><UserX size={48} /></div>
                <h2 className="text-2xl font-black text-duoc-blue mb-2">Verificación no exitosa</h2>
                <p className="text-gray-600 text-base mb-6 leading-relaxed">
                    No pude validarte. Por favor intenta de nuevo.
                </p>
                <p className="text-gray-800 font-medium mb-8">¿Deseas ser derivado a un asesor presencial?</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                    <button className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-white border border-gray-300 text-[#111111] font-bold text-[16px] hover:bg-gray-50 transition-colors shadow-sm min-h-[48px]" onClick={onAsesorYes}>
                        <CheckCircle size={22} className="text-[#111111]" /> Sí, derivar a asesor
                    </button>
                    <button className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-white border border-gray-300 text-[#111111] font-bold text-[16px] hover:bg-gray-50 transition-colors shadow-sm min-h-[48px]" onClick={onAsesorNo}>
                        <XCircle size={22} className="text-[#111111]" /> No, salir
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center w-full max-w-3xl mx-auto">
            <CameraPreview
                onFaceMatched={(userData) => {
                    onSuccess(userData);
                }}
                onFail={onFail}
                inputMode={inputMode}
            />

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
                    <button className="flex justify-center items-center gap-2 py-3 bg-[#FFFFFF] text-[#111111] border-2 border-transparent shadow-sm rounded-xl font-bold text-[16px] hover:bg-gray-50 min-h-[48px]" onClick={onSuccess}>
                        <CheckCircle size={20} className="text-green-600" /> Éxito
                    </button>
                    <button className="flex justify-center items-center gap-2 py-3 bg-[#FFFFFF] text-[#111111] border-2 border-transparent shadow-sm rounded-xl font-bold text-[16px] hover:bg-gray-50 min-h-[48px]" onClick={onFail}>
                        <XCircle size={20} className="text-red-600" /> Fallar
                    </button>
                </div>
            </div>
        </div>
    );
}
