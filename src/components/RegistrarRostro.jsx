import React, { useEffect, useRef, useState } from 'react';
import { loadModels } from '../services/presenceService';
import { startCamera, stopCamera, analyzeFace } from '../services/facialRecognitionService';

export default function RegistrarRostro() {
    const videoRef = useRef(null);
    const audioRef = useRef(null); // Just to respect refs
    const imageRef = useRef(null);
    const streamRef = useRef(null);
    const [cameraReady, setCameraReady] = useState(false);
    const [imageSrc, setImageSrc] = useState(null);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [descriptorText, setDescriptorText] = useState(null);
    const [escaneando, setEscaneando] = useState(false);

    useEffect(() => {
        loadModels().then(ok => setModelsLoaded(ok));
        return () => {
            if (streamRef.current) stopCamera(streamRef.current);
        };
    }, []);

    const iniciarCamara = async () => {
        try {
            const stream = await startCamera();
            streamRef.current = stream;
            setCameraReady(true);
        } catch (error) {
            alert("Error con cámara: " + error.message);
        }
    };

    // Esto asegura que apenas cambie cameraReady a true, el video reciba la cámara
    useEffect(() => {
        if (cameraReady && videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
        }
    }, [cameraReady]);

    const onImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageSrc(URL.createObjectURL(file));

            // Apagamos la cámara si estaba prendida
            if (streamRef.current) stopCamera(streamRef.current);
            setCameraReady(false);
        }
    };

    const extraerRostro = async () => {
        const elementToScan = imageSrc ? imageRef.current : videoRef.current;
        if (!elementToScan || !modelsLoaded) return;

        setEscaneando(true);
        try {
            const faceapi = await import('@vladmandic/face-api');
            const detection = await faceapi.detectSingleFace(
                elementToScan,
                new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })
            ).withFaceLandmarks().withFaceDescriptor();

            if (detection) {
                const vector = Array.from(detection.descriptor);
                setDescriptorText(JSON.stringify(vector));
            } else {
                alert("No se encontró ningún rostro claro. Usa una foto donde la persona mire de frente, con buena luz y sin elementos tapando el rostro.");
            }
        } catch (error) {
            alert("Falló la extracción matemática: " + error.message);
        } finally {
            setEscaneando(false);
        }
    };

    const copiarAlPortapapeles = () => {
        navigator.clipboard.writeText(descriptorText).then(() => {
            alert("¡Matriz facial copiada! Ahora envíasela a Tania por WhatsApp o Teams.");
        });
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-8 font-sans">
            <h1 className="text-3xl font-bold text-blue-900 mb-2">Registro Biométrico en Línea</h1>
            <p className="text-gray-600 mb-8 max-w-xl text-center">
                Esta página secreta te permite generar tu huella facial de forma segura desde tu casa. Tu rostro NUNCA viajará por internet; el escaneo numérico sucederá 100% en el procesador de tu PC o celular.
            </p>

            <div className="bg-white p-6 rounded-3xl shadow-xl border w-full max-w-lg mb-8">
                <div className="w-full aspect-[4/3] bg-black rounded-2xl overflow-hidden mb-6 flex items-center justify-center relative">
                    {imageSrc ? (
                        <img ref={imageRef} src={imageSrc} className="w-full h-full object-contain" alt="Rostro a escanear" />
                    ) : cameraReady ? (
                        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover -scale-x-100" />
                    ) : (
                        <div className="text-white text-center flex flex-col items-center gap-4 p-4">
                            <button onClick={iniciarCamara} className="bg-blue-600 w-full text-white font-bold py-3 px-6 rounded-full shadow-lg">
                                Encender Cámara
                            </button>
                            <span className="text-gray-400 text-sm">O puedes</span>
                            <label className="bg-gray-700 w-full text-white font-bold py-3 px-6 rounded-full shadow-lg cursor-pointer hover:bg-gray-600 transition-colors">
                                Subir Foto del Rostro
                                <input type="file" accept="image/*" className="hidden" onChange={onImageUpload} />
                            </label>
                        </div>
                    )}
                </div>

                <button
                    onClick={extraerRostro}
                    disabled={(!cameraReady && !imageSrc) || !modelsLoaded || escaneando}
                    className={`w-full py-4 text-white font-bold text-lg rounded-2xl shadow transition-colors ${escaneando ? 'bg-orange-500' : 'bg-green-600 hover:bg-green-700'} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    {escaneando ? 'Extrayendo matemáticas...' : (imageSrc ? 'Escanear Foto' : 'Escanear Webcam')}
                </button>

                {imageSrc && (
                    <button onClick={() => { setImageSrc(null); setDescriptorText(null); }} className="w-full mt-3 text-red-500 font-bold hover:underline">
                        Quitar Foto
                    </button>
                )}
            </div>

            {descriptorText && (
                <div className="bg-yellow-50 border-2 border-yellow-200 p-6 rounded-xl w-full max-w-2xl mt-4">
                    <h3 className="font-bold text-yellow-800 mb-2">¡Éxito! Esta es la matemática de tu rostro:</h3>
                    <textarea
                        readOnly
                        value={descriptorText}
                        className="w-full h-32 p-3 text-xs font-mono bg-white border border-gray-300 rounded mb-4"
                    />
                    <button
                        onClick={copiarAlPortapapeles}
                        className="bg-blue-900 text-white font-bold py-2 px-8 rounded-full shadow-md w-full"
                    >
                        COPIAR MATRIZ Y ENVIAR A TANIA
                    </button>
                </div>
            )}
        </div>
    );
}
