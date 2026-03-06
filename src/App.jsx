import { useState, useCallback, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { STATES, EVENTS, transition, createInitialContext } from './machines/totemMachine';
import { useSession } from './hooks/useSession';
import { useSpeech } from './hooks/useSpeech';
import { mapVoiceToOption } from './services/claudeService';
import { loadModels, startDetection, stopDetection } from './services/presenceService';
import { startCamera, stopCamera } from './services/facialRecognitionService';
import { sendTicketEmail } from './services/emailService';
import VIDEOS from './constants/videos';
import TRAMITES from './constants/tramites';
import VideoAvatar from './components/VideoAvatar';
import BiometricLogin from './components/BiometricLogin';
import MainMenu from './components/MainMenu';
import ResultCard from './components/ResultCard';
import AccessibleMode from './components/AccessibleMode';
import AccessibilityMenu from './components/AccessibilityMenu';
import RegistrarRostro from './components/RegistrarRostro';
import {
    Monitor, Accessibility, RefreshCw, LogOut,
    CheckCircle, AlertTriangle, HelpCircle,
    Hand, Clock, Settings, Mic, CheckCircle2,
    ArrowLeft
} from 'lucide-react';

/* ═══════════════════════════════════════════════════
   SUBTÍTULOS EXACTOS
   ═══════════════════════════════════════════════════ */
const SUBTITLES = {
    WELCOME: 'Hola, bienvenido a DUOC UC. Soy Leonor. Di hola para interactuar por voz, presiona Iniciar para usar la pantalla, o di accesibilidad o presiona el botón para personalizar tu experiencia.',
    LOGIN: 'Por favor mira directamente a la cámara para validar tu identidad.',
    LOGIN_SUCCESS: 'Identidad validada.',
    LOGIN_FAIL: 'No pude validar tu identidad. Por favor intenta de nuevo.',
    MENU: (name) => `Hola ${name ? name : ''}, ¿en qué puedo ayudarte hoy? Di uno para Certificado de Alumno Regular, dos para Horario Académico, tres para Progreso Académico, cuatro para Situación Financiera, o cero para ser atendido por un asesor académico.`,
    CONFIRMING: '¿Confirmas tu selección? Di sí o no.',
    RESULT: 'Tu trámite fue procesado exitosamente. ¿Necesitas algo más? Di sí o no.',
    TRAMITE_ERROR: 'No fue posible completar tu trámite. ¿Deseas intentarlo nuevamente? Di sí o no.',
    GOODBYE: 'Ha sido un placer ayudarte. ¡Hasta pronto!',
    INACTIVITY: '¿Sigues ahí? Di sí para continuar, de lo contrario cerraré la sesión en unos segundos.',
    NO_ENTENDI: 'No entendí tu respuesta. Por favor intenta de nuevo.',
};

function getVideoForState(state, context) {
    switch (state) {
        case STATES.WELCOME: return VIDEOS.WELCOME;
        case STATES.LOGIN:
            if (context.showAsesorPrompt) return VIDEOS.ASESOR;
            if (context.subState === 'bio_failed') return VIDEOS.LOGIN_FAIL;
            if (context.subState === 'login_success') return VIDEOS.LOGIN_SUCCESS;
            return VIDEOS.LOGIN_INSTRUCTIONS;
        case STATES.MENU:
            if (context.subState === 'not_understood') return VIDEOS.NO_ENTENDI;
            return VIDEOS.MENU;
        case STATES.CONFIRMING: return VIDEOS.CONFIRMING;
        case STATES.EXECUTING:
            if (context.showRetryPrompt) return VIDEOS.TRAMITE_ERROR;
            return VIDEOS.CONFIRMING;
        case STATES.RESULT: return VIDEOS.TRAMITE_SUCCESS;
        case STATES.GOODBYE: return VIDEOS.GOODBYE;
        case STATES.INACTIVITY: return VIDEOS.INACTIVITY;
        default: return null;
    }
}

function getSubtitleForState(state, context) {
    switch (state) {
        case STATES.WELCOME: return SUBTITLES.WELCOME;
        case STATES.LOGIN:
            if (context.subState === 'bio_failed') return SUBTITLES.LOGIN_FAIL;
            if (context.subState === 'login_success') return SUBTITLES.LOGIN_SUCCESS;
            return SUBTITLES.LOGIN;
        case STATES.MENU:
            if (context.subState === 'not_understood') return SUBTITLES.NO_ENTENDI;
            return SUBTITLES.MENU(context.userData?.nombre || '');
        case STATES.CONFIRMING: return SUBTITLES.CONFIRMING;
        case STATES.EXECUTING:
            if (context.showRetryPrompt) return SUBTITLES.TRAMITE_ERROR;
            return null;
        case STATES.RESULT: return SUBTITLES.RESULT;
        case STATES.GOODBYE: return SUBTITLES.GOODBYE;
        case STATES.INACTIVITY: return SUBTITLES.INACTIVITY;
        default: return null;
    }
}

/* ═══════════════════════════════════════════════════
   APP ENTRY POINT (Secret Toggle for Registration)
   ═══════════════════════════════════════════════════ */
export default function Application() {
    const [showRegistrar, setShowRegistrar] = useState(false);

    useEffect(() => {
        const onKeyDown = (e) => {
            // Atajo secreto: Ctrl + Espacio
            if (e.ctrlKey && e.code === 'Space') {
                e.preventDefault();
                setShowRegistrar(prev => !prev);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);

    if (showRegistrar) {
        return (
            <div className="relative w-full min-h-screen">
                <button
                    onClick={() => setShowRegistrar(false)}
                    className="absolute top-4 left-4 z-50 bg-gray-800 text-white rounded-full px-4 py-2 opacity-50 hover:opacity-100"
                >
                    Volver al Tótem
                </button>
                <RegistrarRostro />
            </div>
        );
    }

    return <App />;
}

/* ═══════════════════════════════════════════════════
   KIOSK APP CORE
   ═══════════════════════════════════════════════════ */
function App() {
    const [currentState, setCurrentState] = useState(STATES.IDLE);
    const [context, setContext] = useState(createInitialContext());
    const [isProcessingVoice, setIsProcessingVoice] = useState(false);
    const [tramiteResultText, setTramiteResultText] = useState('');

    // Accessibility Settings State
    const [accessSettings, setAccessSettings] = useState({
        screenReader: false,
        highContrast: false,
        largeText: false,
        textSpacing: false,
        stopAnimations: false,
        hideImages: false,
        dyslexiaFont: false
    });
    const [faceModelsReady, setFaceModelsReady] = useState(false);
    const [idleCameraError, setIdleCameraError] = useState(false);
    const [detectingFace, setDetectingFace] = useState(false);
    const [videoEnded, setVideoEnded] = useState(false);

    const avatarRef = useRef(null);
    const idleVideoRef = useRef(null);
    const idleStreamRef = useRef(null);
    const inactivityTimerRef = useRef(null);
    const transcriptRef = useRef('');
    const processingRef = useRef(false);   // guard for handleMenuVoice
    const executingStarted = useRef(false);   // guard for EXECUTING side-effect

    /* ─── Session & Speech ─── */
    const handleTimeout = useCallback(() => {
        setCurrentState(prev => {
            const result = transition(prev, { type: EVENTS.TIMEOUT }, context);
            setContext(result.context);
            return result.state;
        });
    }, [context]);

    const session = useSession(handleTimeout);
    const speech = useSpeech();

    const send = useCallback((event) => {
        session.resetTimer();
        const result = transition(currentState, event, context);
        setCurrentState(result.state);
        setContext(result.context);
        return result;
    }, [currentState, context, session]);

    /* ─── Derived ─── */
    const isVoice = session.inputMode === 'VOICE';
    const isTouch = session.inputMode === 'TOUCH';
    const isAccessible = session.inputMode === 'ACCESSIBLE' || context.modoAccesible;

    /* ─── Session timer ─── */
    useEffect(() => {
        const timedStates = [STATES.WELCOME, STATES.LOGIN, STATES.MENU, STATES.CONFIRMING, STATES.RESULT];
        if (timedStates.includes(currentState)) session.startTimer();
        else session.stopTimer();
    }, [currentState]);

    useEffect(() => { session.setModoAccesible(context.modoAccesible); }, [context.modoAccesible]);

    /* ═══════════════════════════════════════════════
       VIDEO ENDED → STT
       ═══════════════════════════════════════════════ */

    // Reset videoEnded on state change
    useEffect(() => {
        setVideoEnded(false);
        speech.stopListening();
        speech.resetTranscript();
        transcriptRef.current = '';
        processingRef.current = false;
    }, [currentState]);

    // Touch/Accessible: no video, mark ended immediately
    useEffect(() => {
        if ((isAccessible || isTouch) && currentState !== STATES.IDLE && !videoEnded) {
            const t = setTimeout(() => setVideoEnded(true), 200);
            return () => clearTimeout(t);
        }
    }, [currentState, isAccessible, isTouch, videoEnded]);

    function handleVideoEnded() {
        setVideoEnded(true);
        if (currentState === STATES.GOODBYE) send({ type: EVENTS.VIDEO_ENDED });
    }

    /* ─── UNIFIED STT activation — fires when video ends ─── */
    useEffect(() => {
        if (!videoEnded) return;

        // WELCOME: listen regardless of mode (user picks mode by voice)
        if (currentState === STATES.WELCOME) {
            if (!session.inputMode) speech.startListening();
            return;
        }

        // All other states: only in VOICE mode
        if (!isVoice) return;

        const activeStates = [
            STATES.MENU,
            STATES.CONFIRMING,
            STATES.RESULT,
            STATES.INACTIVITY,
        ];
        const isRetry = currentState === STATES.EXECUTING && context.showRetryPrompt;

        if (activeStates.includes(currentState) || isRetry) {
            // Don't check speech.isListening here — it may be stale.
            // useSpeech handles dedup internally via listeningRef.
            const delay = setTimeout(() => {
                if (!processingRef.current) speech.startListening();
            }, 400);
            return () => clearTimeout(delay);
        }
    }, [videoEnded, currentState, isVoice]);

    /* ═══════════════════════════════════════════════
       TRANSCRIPT HANDLERS
       ═══════════════════════════════════════════════ */
    useEffect(() => {
        if (!speech.transcript || speech.transcript === transcriptRef.current || !videoEnded) return;
        transcriptRef.current = speech.transcript;

        // Stop auto-restart immediately — we're processing this transcript
        speech.stopListening();

        const text = speech.transcript.toLowerCase().trim();

        // WELCOME: mode selection
        if (currentState === STATES.WELCOME && !session.inputMode) {
            if (text.includes('accesibilidad') || text.includes('accesible')) {
                session.setInputMode('ACCESSIBLE');
                session.setModoAccesible(true);
                speech.resetTranscript();
                send({ type: EVENTS.ACCESSIBILITY });
            } else if (text.includes('hola') || text.includes('iniciar') || text.includes('empezar') || text.includes('comenzar')) {
                session.setInputMode('VOICE');
                speech.resetTranscript();
                send({ type: EVENTS.START });
            } else {
                // Didn't understand → retry listening
                transcriptRef.current = '';
                speech.resetTranscript();
                setTimeout(() => speech.startListening(), 400);
            }
            return;
        }

        // MENU: Claude mapping
        if (currentState === STATES.MENU && isVoice) {
            handleMenuVoice(speech.transcript);
            return;
        }

        const hasSi = text.includes('sí') || text.includes('si') || text.includes('claro') || text.includes('dale') || text.includes('confirmar');
        const hasNo = text.includes('no') || text.includes('cancelar') || text.includes('volver');

        if (currentState === STATES.CONFIRMING && isVoice) {
            speech.resetTranscript();
            if (hasSi) send({ type: EVENTS.CONFIRM_YES });
            else if (hasNo) send({ type: EVENTS.CONFIRM_NO });
            else { transcriptRef.current = ''; setTimeout(() => speech.startListening(), 400); }
            return;
        }

        if (currentState === STATES.RESULT && isVoice) {
            speech.resetTranscript();
            if (hasSi) send({ type: EVENTS.MORE_YES });
            else if (hasNo) send({ type: EVENTS.MORE_NO });
            else { transcriptRef.current = ''; setTimeout(() => speech.startListening(), 400); }
            return;
        }

        if (currentState === STATES.EXECUTING && context.showRetryPrompt && isVoice) {
            speech.resetTranscript();
            if (hasSi) send({ type: EVENTS.RETRY_YES });
            else if (hasNo) send({ type: EVENTS.RETRY_NO });
            else { transcriptRef.current = ''; setTimeout(() => speech.startListening(), 400); }
            return;
        }

        if (currentState === STATES.INACTIVITY) {
            speech.resetTranscript();
            if (hasSi) send({ type: EVENTS.CONTINUE });
            else if (hasNo) send({ type: EVENTS.EXIT });
            else { transcriptRef.current = ''; setTimeout(() => speech.startListening(), 400); }
            return;
        }
    }, [speech.transcript, currentState, videoEnded]);

    /* ─── handleMenuVoice with processingRef guard ─── */
    async function handleMenuVoice(transcript) {
        if (processingRef.current) return;
        processingRef.current = true;
        setIsProcessingVoice(true);
        speech.stopListening();
        try {
            const option = await mapVoiceToOption(transcript);
            speech.resetTranscript();
            transcriptRef.current = '';
            if (option !== null) send({ type: EVENTS.SELECT_OPTION, option });
            else send({ type: EVENTS.NOT_UNDERSTOOD });
        } catch {
            send({ type: EVENTS.NOT_UNDERSTOOD });
        } finally {
            setIsProcessingVoice(false);
            processingRef.current = false;
        }
    }

    /* ═══════════════════════════════════════════════
       SIDE EFFECTS
       ═══════════════════════════════════════════════ */

    // EXECUTING: 95% success
    useEffect(() => {
        if (currentState !== STATES.EXECUTING || context.showRetryPrompt) {
            executingStarted.current = false;
            return;
        }
        if (executingStarted.current) return;
        executingStarted.current = true;

        const ok = true; // Removed random failure for documentation generation
        const t = setTimeout(() => {
            if (ok) {
                const tr = TRAMITES.find(t => t.id === context.selectedTramite);
                setTramiteResultText(tr?.resultado || 'Trámite completado.');
                send({ type: EVENTS.EXECUTE_SUCCESS });
            } else {
                send({ type: EVENTS.EXECUTE_FAIL });
            }
        }, 2000);
        return () => clearTimeout(t);
    }, [currentState, context.showRetryPrompt]);

    // GOODBYE timeout
    useEffect(() => {
        if (currentState !== STATES.GOODBYE) return;

        // Si hay un ticket generado y sabemos quién es el usuario, se lo enviamos por correo
        if (context.ticketNumber && context.userData) {
            sendTicketEmail(context.userData, context.ticketNumber).catch(err => console.error("Error enviando ticket:", err));
        }

        // Simulación de envío GLPI (Esqueleto)
        if (context.ticketNumber) {
            console.log(`[GLPI SIMULADO] Se registra ticket ${context.ticketNumber} en sala de espera.`);
            // A futuro: sendTicketToGLPI(context.ticketNumber); 
        }

        const t = setTimeout(() => send({ type: EVENTS.VIDEO_ENDED }), 8000);
        return () => clearTimeout(t);
    }, [currentState, context.ticketNumber, context.userData]);

    // INACTIVITY 30s
    useEffect(() => {
        if (currentState !== STATES.INACTIVITY) return;
        inactivityTimerRef.current = setTimeout(() => send({ type: EVENTS.INACTIVITY_TIMEOUT }), 30000);
        return () => clearTimeout(inactivityTimerRef.current);
    }, [currentState]);

    // IDLE reset
    useEffect(() => {
        if (currentState !== STATES.IDLE) return;
        session.resetSession();
        setTramiteResultText('');
        transcriptRef.current = '';

        // Reset accessibility settings
        setAccessSettings({
            screenReader: false,
            highContrast: false,
            largeText: false,
            textSpacing: false,
            stopAnimations: false,
            hideImages: false,
            dyslexiaFont: false
        });
        setContext(prev => ({ ...prev, modoAccesible: false }));
    }, [currentState]);

    /* ─── Face detection ─── */
    useEffect(() => { loadModels().then(ok => setFaceModelsReady(ok)); }, []);

    useEffect(() => {
        if (currentState !== STATES.IDLE) {
            stopDetection();
            if (idleStreamRef.current) { stopCamera(idleStreamRef.current); idleStreamRef.current = null; }
            setDetectingFace(false);
            return;
        }
        let cancelled = false;
        async function init() {
            try {
                const stream = await startCamera();
                if (cancelled) { stopCamera(stream); return; }
                idleStreamRef.current = stream;
                if (idleVideoRef.current) idleVideoRef.current.srcObject = stream;
                setIdleCameraError(false);
                if (faceModelsReady && idleVideoRef.current) {
                    const poll = () => {
                        if (cancelled) return;
                        if (idleVideoRef.current?.readyState >= 2) {
                            setDetectingFace(true);
                            // La detección queda visual solo como tracking del círculo. 
                            // Ya NO dispara eventos automáticos para forzar un click y desbloquear el audio.
                            startDetection(idleVideoRef.current, () => { });
                        } else setTimeout(poll, 300);
                    };
                    poll();
                }
            } catch { if (!cancelled) setIdleCameraError(true); }
        }
        init();
        return () => {
            cancelled = true;
            stopDetection();
            if (idleStreamRef.current) { stopCamera(idleStreamRef.current); idleStreamRef.current = null; }
        };
    }, [currentState, faceModelsReady]);

    /* ════════════════════════════════════════════════
       HELPERS
       ════════════════════════════════════════════════ */
    const videoSrc = getVideoForState(currentState, context);
    const subtitle = getSubtitleForState(currentState, context);

    function renderSubtitle(text) {
        if (!text) return null;
        // Hide voice-oriented subtitles in Touch and Accessible modes (button-based interaction)
        if (isTouch || isAccessible) return null;
        return (
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl px-8 py-5 mb-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)] text-center max-w-2xl w-full" role="status" aria-live="polite">
                <p className="text-xl md:text-2xl text-white font-medium leading-relaxed drop-shadow-sm">{text}</p>
            </div>
        );
    }

    function renderVoiceYesNo(prompt) {
        if (!isVoice) return null;
        if (!videoEnded) return <p className="text-white/50 text-sm animate-pulse mt-4">Leonor está hablando...</p>;
        return (
            <div className="flex flex-col items-center mt-6 gap-3">
                {speech.isListening && (
                    <div className="flex items-center gap-4 bg-white border border-gray-200 px-6 py-3 rounded-full text-duoc-blue font-bold shadow-sm">
                        <div className="flex items-end gap-1 h-5">
                            <span className="w-1 bg-duoc-yellow rounded-full animate-[voiceBar_1s_ease-in-out_infinite] h-[40%]" />
                            <span className="w-1 bg-duoc-yellow rounded-full animate-[voiceBar_1.2s_ease-in-out_infinite_0.1s] h-[80%]" />
                            <span className="w-1 bg-duoc-yellow rounded-full animate-[voiceBar_0.9s_ease-in-out_infinite_0.2s] h-[60%]" />
                        </div>
                        <span>{prompt}</span>
                    </div>
                )}
                {speech.transcript && (
                    <div className="px-6 py-3 bg-white border border-gray-200 rounded-2xl text-duoc-blue font-medium max-w-md text-center shadow-sm">
                        Escuché: &ldquo;<span className="text-duoc-blue font-bold">{speech.transcript}</span>&rdquo;
                    </div>
                )}
            </div>
        );
    }

    /* ════════════════════════════════════════════════
       RENDER: Content per state
       ════════════════════════════════════════════════ */
    function renderContent() {
        switch (currentState) {

            case STATES.WELCOME:
                return (
                    <div className="flex flex-col items-center w-full max-w-3xl">
                        {renderSubtitle(subtitle)}

                        {/* Voice Input Prompt */}
                        {videoEnded && speech.isListening && !session.inputMode && (
                            <div className="mt-4 mb-8 flex items-center gap-4 bg-white border border-gray-200 px-8 py-4 rounded-full text-duoc-blue font-bold shadow-md">
                                <div className="flex items-end gap-1 h-6">
                                    <span className="w-1 bg-duoc-yellow rounded-full animate-[voiceBar_1s_ease-in-out_infinite] h-[40%]" />
                                    <span className="w-1 bg-duoc-yellow rounded-full animate-[voiceBar_1.2s_ease-in-out_infinite_0.1s] h-[80%]" />
                                    <span className="w-1 bg-duoc-yellow rounded-full animate-[voiceBar_0.9s_ease-in-out_infinite_0.2s] h-[60%]" />
                                    <span className="w-1 bg-duoc-yellow rounded-full animate-[voiceBar_1.1s_ease-in-out_infinite_0.3s] h-[100%]" />
                                </div>
                                <span className="text-lg">Di <strong className="text-duoc-yellow font-black text-xl">"hola"</strong> para iniciar</span>
                            </div>
                        )}
                        {!videoEnded && <p className="text-gray-400 font-medium text-sm animate-pulse mt-4 mb-4">Leonor está hablando...</p>}

                        {/* Interactive Buttons */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mt-6" role="group" aria-label="Opciones de inicio">
                            <button aria-label="Iniciar modo pantalla táctil" data-action="primary" className="col-span-1 sm:col-span-2 flex items-center justify-center gap-3 px-8 py-6 rounded-2xl bg-gradient-to-br from-duoc-yellow to-duoc-yellow-dark text-black font-black text-2xl hover:scale-[1.02] transition-transform shadow-[0_8px_32px_rgba(242,169,0,0.3)] focus:outline-none focus:ring-4 focus:ring-duoc-yellow/50"
                                onClick={() => { session.setInputMode('TOUCH'); send({ type: EVENTS.START }); }}>
                                <Monitor size={28} /> Iniciar Touch
                            </button>
                            <button aria-label="Activar modo accesibilidad" className="flex items-center justify-center gap-3 px-6 py-5 rounded-2xl bg-gradient-to-br from-duoc-blue-light to-duoc-blue text-white font-bold text-xl hover:scale-105 transition-transform shadow-[0_8px_32px_rgba(0,85,165,0.4)] focus:outline-none focus:ring-4 focus:ring-duoc-blue/50"
                                onClick={() => { session.setInputMode('ACCESSIBLE'); session.setModoAccesible(true); send({ type: EVENTS.ACCESSIBILITY }); }}>
                                <Accessibility size={24} /> Accesibilidad
                            </button>
                            <button aria-label="Repetir mensaje de bienvenida" className="flex items-center justify-center gap-2 px-6 py-5 rounded-2xl bg-white border border-gray-200 text-duoc-blue font-semibold text-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-4 focus:ring-duoc-blue/30 shadow-sm"
                                onClick={() => { if (avatarRef.current) { avatarRef.current.replay(); setVideoEnded(false); speech.stopListening(); } }}>
                                <RefreshCw size={22} /> Repetir
                            </button>
                            <button aria-label="Salir de la aplicación" data-action="back" className="col-span-1 sm:col-span-2 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-transparent border border-gray-300 text-gray-500 font-semibold text-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-4 focus:ring-gray-300" onClick={() => send({ type: EVENTS.EXIT })}>
                                <LogOut size={22} /> Salir
                            </button>
                        </div>
                    </div>
                );

            case STATES.LOGIN:
                return (
                    <>
                        {subtitle && renderSubtitle(subtitle)}
                        <BiometricLogin
                            onSuccess={(userData) => send({ type: EVENTS.BIO_SUCCESS, userData })}
                            onFail={() => send({ type: EVENTS.BIO_FAIL })}
                            reintentosBio={context.reintentosBio}
                            showAsesorPrompt={context.showAsesorPrompt}
                            onAsesorYes={() => send({ type: EVENTS.ASESOR_YES })}
                            onAsesorNo={() => send({ type: EVENTS.ASESOR_NO })}
                            modoAccesible={isAccessible}
                        />
                    </>
                );

            case STATES.ACCESSIBILITY_SETUP:
                return (
                    <AccessibilityMenu
                        onComplete={() => send({ type: EVENTS.FINISH_ACCESSIBILITY_SETUP })}
                        currentSettings={accessSettings}
                        onSettingChange={(id, value) => {
                            setAccessSettings(prev => ({ ...prev, [id]: value }));
                            // If screen reader is toggled, ensure we trigger a polite announcement
                            if (id === 'screenReader' && value) {
                                const msg = new SpeechSynthesisUtterance('Lector de pantalla activado');
                                msg.lang = 'es-ES';
                                window.speechSynthesis.speak(msg);
                            }
                        }}
                    />
                );

            case STATES.MENU:
                return (
                    <MainMenu
                        onSelectOption={(option) => send({ type: EVENTS.SELECT_OPTION, option })}
                        isListening={speech.isListening}
                        transcript={speech.transcript}
                        modoAccesible={isAccessible}
                        isProcessingVoice={isProcessingVoice}
                        inputMode={session.inputMode}
                        menuVideoEnded={videoEnded}
                        userData={context.userData}
                    />
                );

            case STATES.CONFIRMING: {
                const tramite = TRAMITES.find(t => t.id === context.selectedTramite);
                return (
                    <div className="flex flex-col items-center justify-center w-full max-w-3xl mx-auto text-center">
                        <div className="text-duoc-blue mb-6 drop-shadow-sm"><HelpCircle size={56} /></div>
                        <h2 className="text-4xl font-black text-duoc-blue mb-8 drop-shadow-sm">Confirmar Trámite</h2>

                        <div className="flex flex-col md:flex-row items-center gap-6 bg-white border border-gray-200 rounded-3xl p-8 shadow-sm w-full mb-8 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-duoc-yellow to-duoc-yellow-dark text-black font-black text-3xl shrink-0 shadow-sm">
                                {tramite?.id}
                            </div>
                            <div className="text-center md:text-left">
                                <h3 className="text-2xl font-bold text-duoc-blue mb-2">{tramite?.nombre}</h3>
                                <p className="text-gray-600 text-lg leading-relaxed">{tramite?.descripcion}</p>
                            </div>
                        </div>

                        {renderSubtitle(subtitle)}
                        {renderVoiceYesNo('Di "sí" o "no"')}

                        {!isVoice && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mt-4" role="group" aria-label="Confirmar o cancelar trámite">
                                <button aria-label="Sí, confirmar trámite" data-action="primary" className="flex items-center justify-center gap-3 px-8 py-5 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 text-white font-bold text-xl hover:scale-105 transition-transform shadow-[0_8px_25px_rgba(74,222,128,0.3)] focus:outline-none focus:ring-4 focus:ring-green-400/50" onClick={() => send({ type: EVENTS.CONFIRM_YES })}>
                                    <CheckCircle size={24} /> Sí, continuar
                                </button>
                                <button aria-label="No, volver al menú principal" data-action="back" className="flex items-center justify-center gap-3 px-8 py-5 rounded-2xl bg-white border border-gray-300 text-gray-700 font-bold text-xl hover:bg-gray-50 transition-colors shadow-sm focus:outline-none focus:ring-4 focus:ring-gray-300" onClick={() => send({ type: EVENTS.CONFIRM_NO })}>
                                    <ArrowLeft size={24} /> No, volver al menú
                                </button>
                            </div>
                        )}
                    </div>
                );
            }

            case STATES.EXECUTING:
                if (context.showRetryPrompt) {
                    return (
                        <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto text-center">
                            <div className="text-red-500 mb-6 drop-shadow-sm"><AlertTriangle size={56} /></div>
                            <h2 className="text-4xl font-black text-duoc-blue mb-8">Error en el trámite</h2>
                            {renderSubtitle(subtitle)}
                            {renderVoiceYesNo('Di "sí" o "no"')}
                            {!isVoice && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mt-6" role="group" aria-label="Reintentar o cancelar">
                                    <button aria-label="Sí, reintentar trámite" data-action="primary" className="flex items-center justify-center gap-3 px-8 py-5 rounded-2xl bg-gradient-to-br from-duoc-yellow to-duoc-yellow-dark text-black font-bold text-xl hover:scale-105 transition-transform shadow-lg focus:outline-none focus:ring-4 focus:ring-duoc-yellow/50" onClick={() => send({ type: EVENTS.RETRY_YES })}>
                                        <RefreshCw size={24} /> Sí, reintentar
                                    </button>
                                    <button aria-label="No, volver al menú" data-action="back" className="flex items-center justify-center gap-3 px-8 py-5 rounded-2xl bg-white border border-gray-300 text-gray-700 font-bold text-xl hover:bg-gray-50 transition-colors focus:outline-none focus:ring-4 focus:ring-gray-300 shadow-sm" onClick={() => send({ type: EVENTS.RETRY_NO })}>
                                        <ArrowLeft size={24} /> No, volver al menú
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                }
                return (
                    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto text-center">
                        <div className="text-duoc-yellow-dark mb-8 animate-spin drop-shadow-sm"><Settings size={64} /></div>
                        <h2 className="text-3xl font-black text-duoc-blue mb-10 tracking-wide">Procesando trámite...</h2>
                        <div className="w-full flex flex-col items-center">
                            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden border border-gray-300 mb-5 shadow-inner relative">
                                <div className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-duoc-yellow-dark via-duoc-yellow to-duoc-yellow-light rounded-full w-1/2 animate-[scanLine_1.5s_ease-in-out_infinite_alternate]" style={{ transformOrigin: 'left' }} />
                            </div>
                            <p className="text-gray-500 font-bold text-lg animate-pulse tracking-[0.2em] uppercase">Por favor espera</p>
                        </div>
                    </div>
                );

            case STATES.RESULT:
                return (
                    <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto text-center">
                        <div className="text-green-500 mb-4 drop-shadow-sm"><CheckCircle2 size={56} /></div>
                        <h2 className="text-4xl font-black text-duoc-blue mb-8">Trámite Exitoso</h2>
                        <ResultCard tramiteId={context.selectedTramite} resultado={tramiteResultText} userData={context.userData} />

                        <div className="mt-8 w-full max-w-2xl mx-auto">
                            {renderSubtitle(subtitle)}
                            {renderVoiceYesNo('Di "sí" o "no"')}
                            {!isVoice && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mt-4" role="group" aria-label="Más trámites o finalizar">
                                    <button aria-label="Sí, realizar otro trámite" data-action="primary" className="flex items-center justify-center gap-3 px-8 py-5 rounded-2xl bg-gradient-to-br from-duoc-yellow to-duoc-yellow-dark text-black font-bold text-xl hover:scale-105 transition-transform shadow-[0_8px_25px_rgba(242,169,0,0.3)] focus:outline-none focus:ring-4 focus:ring-duoc-yellow/50" onClick={() => send({ type: EVENTS.MORE_YES })}>
                                        <CheckCircle size={24} /> Sí, otro trámite
                                    </button>
                                    <button aria-label="No, finalizar sesión" data-action="back" className="flex items-center justify-center gap-3 px-8 py-5 rounded-2xl bg-white border border-gray-300 text-gray-700 font-bold text-xl hover:bg-gray-50 transition-colors shadow-sm focus:outline-none focus:ring-4 focus:ring-gray-300" onClick={() => send({ type: EVENTS.MORE_NO })}>
                                        <Hand size={24} /> No, finalizar
                                    </button>
                                </div>
                            )}
                        </div>
                        {context.accionesExitosas >= 3 && (
                            <div className="mt-8 flex items-center justify-center gap-3 px-6 py-4 bg-orange-500/20 border border-orange-500/50 text-orange-200 rounded-xl font-medium shadow-md">
                                <AlertTriangle size={20} className="animate-pulse" />
                                Llevas {context.accionesExitosas} trámites. Máximo 4 permitidos por sesión.
                            </div>
                        )}
                    </div>
                );

            case STATES.GOODBYE:
                return (
                    <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto text-center">
                        <div className="text-[5rem] font-black text-duoc-blue drop-shadow-sm tracking-tighter mb-2 animate-pulse">DUOC UC</div>
                        <div className="text-duoc-yellow-dark mb-8 font-medium tracking-[0.3em] uppercase">Tótem de Autoservicio</div>
                        <h2 className="text-5xl font-black text-duoc-blue mb-8">¡Gracias por tu visita!</h2>
                        {renderSubtitle(subtitle)}
                        {context.ticketNumber && (
                            <div className="flex flex-col items-center bg-white border border-gray-200 rounded-3xl p-10 shadow-lg w-full mb-8 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-duoc-yellow to-duoc-yellow-dark" />
                                <span className="text-gray-500 tracking-[0.2em] font-medium uppercase text-sm mb-4">Tu ticket de atención</span>
                                <div className="text-7xl font-black text-duoc-yellow-dark drop-shadow-sm tracking-widest">{context.ticketNumber}</div>
                                <span className="text-gray-800 mt-6 font-medium text-lg">Presenta este número en el mesón de atención</span>
                            </div>
                        )}
                        <p className="text-gray-400 font-medium text-xl mt-4 animate-pulse">Volviendo al inicio...</p>
                    </div>
                );

            case STATES.INACTIVITY:
                return (
                    <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto text-center bg-white p-12 rounded-[3rem] border border-gray-200 shadow-xl">
                        <div className="text-red-500 mb-6 drop-shadow-sm animate-pulse"><Clock size={64} /></div>
                        <h2 className="text-5xl font-black text-duoc-blue mb-6">¿Sigues ahí?</h2>
                        {renderSubtitle(subtitle)}
                        {renderVoiceYesNo('Di "sí" para continuar')}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mt-8" role="group" aria-label="Continuar o salir">
                            <button aria-label="Sí, continuar con la sesión" data-action="primary" className="flex items-center justify-center gap-3 px-8 py-5 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 text-white font-bold text-xl hover:scale-105 transition-transform shadow-[0_8px_25px_rgba(74,222,128,0.3)] focus:outline-none focus:ring-4 focus:ring-green-400/50" onClick={() => send({ type: EVENTS.CONTINUE })}>
                                <CheckCircle size={24} /> Sí, continuar
                            </button>
                            <button aria-label="No, cerrar sesión" data-action="back" className="flex items-center justify-center gap-3 px-8 py-5 rounded-2xl bg-white border border-gray-300 text-gray-700 font-bold text-xl hover:bg-gray-50 transition-colors shadow-sm focus:outline-none focus:ring-4 focus:ring-gray-300" onClick={() => send({ type: EVENTS.EXIT })}>
                                <LogOut size={24} /> No, salir
                            </button>
                        </div>
                        <p className="text-gray-400 font-medium mt-8">Volviendo al inicio si no respondes...</p>
                    </div>
                );

            default: return null;
        }
    }

    /* ════════════════════════════════════════════════
       IDLE  
       ════════════════════════════════════════════════ */
    if (currentState === STATES.IDLE) {
        return (
            <div className="absolute inset-0 w-full h-full cursor-pointer overflow-hidden bg-white z-50 text-duoc-blue" onClick={() => send({ type: EVENTS.DETECT_USER })}>
                {!idleCameraError && (
                    <>
                        <video ref={idleVideoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover opacity-10 mix-blend-multiply" />
                        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent backdrop-blur-[1px]" />
                        {detectingFace && <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] border-4 border-duoc-yellow/50 rounded-full animate-ping" />}
                    </>
                )}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 z-10">
                    <div className="text-[7rem] md:text-[9rem] font-black text-duoc-blue drop-shadow-sm tracking-tighter mb-2">DUOC UC</div>
                    <div className="text-xl md:text-3xl uppercase tracking-[0.4em] font-medium text-duoc-yellow-dark mb-20 drop-shadow-sm">Tótem de Autoservicio</div>

                    <div className="px-12 py-6 bg-white border border-gray-200 rounded-full animate-pulse shadow-md">
                        <span className="text-2xl md:text-4xl font-bold text-duoc-blue">
                            Toca la pantalla para comenzar
                        </span>
                    </div>

                    {detectingFace && (
                        <div className="absolute bottom-16 flex items-center gap-3 text-duoc-blue border border-gray-200 font-bold text-xl bg-white px-8 py-4 rounded-full shadow-md">
                            <span className="w-4 h-4 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                            Detectando rostro...
                        </div>
                    )}
                </div>
            </div>
        );
    }

    /* ════════════════════════════════════════════════
       MAIN LAYOUT
       ════════════════════════════════════════════════ */
    const modeClass = isTouch ? 'kiosk--touch' : isAccessible ? 'kiosk--accessible' : '';
    const timeoutPct = session.timerActive
        ? Math.max(0, (session.timeRemaining / session.TIMEOUT_SECONDS) * 100) : 100;
    const showSidePane = !isTouch && !isAccessible;

    // Generate accessibility classes dynamically based on the toggles
    const accessibilityClasses = Object.entries(accessSettings)
        .filter(([_, isActive]) => isActive)
        .map(([key, _]) => `access-${key}`)
        .join(' ');

    return (
        <div className={`flex flex-col portrait:flex-col landscape:flex-row h-screen w-screen overflow-hidden text-duoc-blue font-sans ${accessSettings.highContrast ? 'bg-black' : 'bg-[#F8F9FA]'} kiosk--${session.inputMode?.toLowerCase() || 'idle'} ${accessibilityClasses}`} onClick={() => session.resetTimer()}>

            {/* LEFT: Avatar */}
            {showSidePane && (
                <div className="flex relative shrink-0 items-center justify-center overflow-hidden w-full landscape:w-[45%] h-[45%] landscape:h-full bg-transparent border-b-2 landscape:border-b-0 landscape:border-r-[1px] border-gray-200 [mask-image:linear-gradient(to_bottom,black_85%,transparent_100%)] landscape:[mask-image:linear-gradient(to_bottom,black_90%,transparent_100%)]">
                    <div className="w-full h-full flex items-center justify-center">
                        <VideoAvatar ref={avatarRef} src={videoSrc} onEnded={handleVideoEnded} />

                        <div className="absolute bottom-6 left-0 right-0 text-center z-10 pointer-events-none">
                            <span className="block text-lg font-bold text-duoc-yellow tracking-wider drop-shadow-md">Leonor</span>
                            <span className="block text-[0.65rem] text-white/50 uppercase tracking-[0.15em] mt-0.5">Asistente Virtual</span>
                        </div>

                        {speech.isListening && (
                            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 flex items-end gap-1 h-8 px-5 py-2 bg-duoc-blue/80 backdrop-blur-md rounded-full shadow-[0_0_15px_rgba(242,169,0,0.3)]">
                                <span className="w-1 bg-duoc-yellow rounded-full animate-bounce h-[40%]" />
                                <span className="w-1 bg-duoc-yellow rounded-full animate-bounce delay-75 h-[80%]" />
                                <span className="w-1 bg-duoc-yellow rounded-full animate-bounce delay-150 h-[60%]" />
                                <span className="w-1 bg-duoc-yellow rounded-full animate-bounce delay-200 h-[100%]" />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* RIGHT: Content */}
            <div className={`flex flex-col relative overflow-y-auto ${!showSidePane ? 'w-full h-full bg-[#F8F9FA]' : 'w-full landscape:w-[55%] h-[55%] landscape:h-full bg-[#F8F9FA]'}`}>

                {session.timerActive && (
                    <div className="w-full shrink-0 h-1 bg-white/5">
                        <div className="h-full bg-gradient-to-r from-duoc-yellow to-red-500 rounded-r-sm transition-all duration-1000 ease-linear" style={{ width: `${timeoutPct}%` }} />
                    </div>
                )}

                <div className="shrink-0 px-8 pt-6 pb-3 text-center">
                    <div className="text-[2.2rem] font-black tracking-tight text-duoc-blue drop-shadow-sm">DUOC UC</div>
                    <div className="text-[0.7rem] uppercase tracking-[0.2em] font-medium text-duoc-yellow mt-1">Tótem de Autoservicio</div>

                    {session.timerActive && session.timeRemaining <= 30 && (
                        <div className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${session.timeRemaining <= 15 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-200 text-gray-700'}`}>
                            <Clock size={14} /> {session.timeRemaining}s
                        </div>
                    )}
                </div>

                <div className={`flex-1 flex flex-col items-center justify-center p-6 sm:p-8 gap-5 ${isTouch ? 'max-w-[680px] mx-auto w-full' : ''}`}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentState}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.25 }}
                            className="w-full flex flex-col items-center"
                        >
                            {isAccessible ? (
                                <AccessibleMode currentState={currentState}>
                                    {renderContent()}
                                </AccessibleMode>
                            ) : renderContent()}
                        </motion.div>
                    </AnimatePresence>
                </div>

                <div className="shrink-0 px-4 py-2 text-center text-[0.6rem] text-gray-500 border-t border-gray-200 flex flex-wrap justify-center items-center gap-3">
                    <span>DUOC UC © 2026</span>
                    {session.inputMode && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-duoc-yellow/10 text-duoc-yellow-dark rounded-md font-semibold">
                            {isVoice && <><Mic size={12} /> Voz</>}
                            {isTouch && <><Monitor size={12} /> Pantalla</>}
                            {isAccessible && !isTouch && <><Accessibility size={12} /> Accesible</>}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
