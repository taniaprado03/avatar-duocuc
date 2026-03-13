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

import SeamlessLoopVideo from './components/SeamlessLoopVideo';
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
    WELCOME: 'Hola, bienvenido a DUOC UC. Soy LeonorIA. Di hola para interactuar por voz, presiona Iniciar para interactuar por pantalla, o di accesibilidad o presiona el botón para adaptar tu experiencia.',
    LOGIN: 'Por favor mira directamente a la cámara para validar tu identidad.',
    LOGIN_SUCCESS: 'Identidad validada.',
    LOGIN_FAIL: 'No pude validar tu identidad. Por favor intenta de nuevo.',
    MENU: (name) => `¿En qué puedo ayudarte hoy?\n• Di uno para Certificado de Alumno Regular\n• Di dos para Progreso Académico\n• Di tres para Ver Horario\n• Di cuatro para Situación Financiera\n• Di cero para ser atendido por un asesor académico`,
    CONFIRMING: '¿Confirmas tu selección? Di sí o no.',
    RESULT: 'Tu trámite fue procesado exitosamente. ¿Necesitas algo más? Di sí o no.',
    TRAMITE_ERROR: 'No fue posible completar tu trámite. ¿Deseas intentarlo nuevamente? Di sí o no.',
    GOODBYE: 'Ha sido un placer ayudarte. ¡Hasta pronto!',
    INACTIVITY: '¿Sigues ahí? Di sí para continuar, de lo contrario cerraré la sesión en unos segundos.',
    NO_ENTENDI: 'No entendí tu respuesta. Por favor intenta de nuevo.',
};

function getVideoForState(state, context, inputMode) {
    if (inputMode === 'TOUCH' || inputMode === 'ACCESSIBLE') return VIDEOS.IDLE;

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

    // Accessibility Settings State — 5 opciones del tótem
    const [accessSettings, setAccessSettings] = useState({
        largeText: false,
        highContrast: false,
        stopAnimations: false,
        dyslexiaFont: false,
        bigButtons: false,
    });
    const [faceModelsReady, setFaceModelsReady] = useState(false);
    const [idleCameraError, setIdleCameraError] = useState(false);
    const [detectingFace, setDetectingFace] = useState(false);
    const [autoplayBlocked, setAutoplayBlocked] = useState(false);
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

    // Reset videoEnded on state change OR subState change (e.g. not_understood)
    useEffect(() => {
        setVideoEnded(false);
        speech.stopListening();
        speech.resetTranscript();
        transcriptRef.current = '';
        processingRef.current = false;
    }, [currentState, context.subState]);

    // Touch/Accessible: no video, mark ended immediately
    useEffect(() => {
        if ((isAccessible || isTouch) && currentState !== STATES.IDLE && !videoEnded) {
            const t = setTimeout(() => setVideoEnded(true), 200);
            return () => clearTimeout(t);
        }
    }, [currentState, isAccessible, isTouch, videoEnded]);

    function handleVideoEnded() {
        setVideoEnded(true);
        if (currentState === STATES.GOODBYE || currentState === STATES.LOGIN) {
            send({ type: EVENTS.VIDEO_ENDED });
        }
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
            const isAccessRequest = /acces\w*/i.test(text) || text.includes('adaptar') || text.includes('accesib');
            console.log('[VOICE WELCOME] transcript:', JSON.stringify(text), 'isAccessRequest:', isAccessRequest);
            if (isAccessRequest) {
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
                            startDetection(idleVideoRef.current, () => {
                                // Cuando face-api detecta un rostro en el frame, activamos el tótem automáticamente
                                send({ type: EVENTS.DETECT_USER });
                            });
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
    const videoSrc = getVideoForState(currentState, context, session.inputMode);
    const subtitle = getSubtitleForState(currentState, context);

    function renderSubtitle(text) {
        if (!text) return null;
        // Hide voice-oriented subtitles in Touch and Accessible modes (button-based interaction)
        if (isTouch || isAccessible) return null;
        return (
            <div className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-[20px] px-8 py-6 mb-6 shadow-[0_8px_32px_rgba(0,0,0,0.15)] text-center max-w-2xl w-full" role="status" aria-live="polite">
                <p className="text-[20px] md:text-[24px] text-[#111111] font-bold leading-relaxed">{text}</p>
            </div>
        );
    }

    function renderVoiceYesNo(prompt) {
        if (!isVoice) return null;
        if (!videoEnded) return <p className="text-white/50 text-sm animate-pulse mt-4">Leonor está hablando...</p>;
        return (
            <div className="flex flex-col items-center mt-6 gap-3">
                {speech.isListening && (
                    <div className="flex items-center gap-4 bg-[#FFFFFF] border border-gray-300 px-6 py-3 rounded-xl text-[#111111] font-bold text-[18px] shadow-sm min-h-[48px]">
                        <div className="flex items-end gap-1 h-5">
                            <span className="w-1 bg-duoc-yellow rounded-full animate-[voiceBar_1s_ease-in-out_infinite] h-[40%]" />
                            <span className="w-1 bg-duoc-yellow rounded-full animate-[voiceBar_1.2s_ease-in-out_infinite_0.1s] h-[80%]" />
                            <span className="w-1 bg-duoc-yellow rounded-full animate-[voiceBar_0.9s_ease-in-out_infinite_0.2s] h-[60%]" />
                        </div>
                        <span>{prompt}</span>
                    </div>
                )}
                {speech.transcript && (
                    <div className="px-6 py-3 bg-[#FFFFFF] border border-gray-300 rounded-xl text-[#111111] font-bold text-[18px] max-w-md text-center shadow-sm min-h-[48px]">
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

                        {/* Indicador de escucha de voz */}
                        {videoEnded && speech.isListening && (
                            <div className="flex items-center gap-4 bg-[#FFFFFF] border border-gray-300 px-6 py-3 rounded-xl text-[#111111] font-bold text-[18px] shadow-sm min-h-[48px] mb-6">
                                <div className="flex items-end gap-1 h-6">
                                    <span className="w-1.5 bg-duoc-yellow rounded-full animate-[voiceBar_1s_ease-in-out_infinite] h-[40%]" />
                                    <span className="w-1.5 bg-duoc-yellow rounded-full animate-[voiceBar_1.2s_ease-in-out_infinite_0.1s] h-[80%]" />
                                    <span className="w-1.5 bg-duoc-yellow rounded-full animate-[voiceBar_0.9s_ease-in-out_infinite_0.2s] h-[60%]" />
                                    <span className="w-1.5 bg-duoc-yellow rounded-full animate-[voiceBar_1.1s_ease-in-out_infinite_0.3s] h-[100%]" />
                                    <span className="w-1.5 bg-duoc-yellow rounded-full animate-[voiceBar_1s_ease-in-out_infinite_0.4s] h-[50%]" />
                                </div>
                                <span>Di "hola" para voz o "accesibilidad" para adaptar tu experiencia</span>
                            </div>
                        )}

                        {!videoEnded && (
                            <p className="text-white/50 text-sm animate-pulse mb-4">Leonor está hablando...</p>
                        )}

                        {/* Interactive Buttons */}
                        <div className="flex flex-col gap-4 w-full mt-6 px-12">
                            <button
                                aria-label="Iniciar modo pantalla táctil"
                                data-action="primary"
                                onClick={() => { session.setInputMode('TOUCH'); send({ type: EVENTS.START }); }}
                                className="flex items-center justify-center gap-4 w-full min-h-[64px] py-5 rounded-xl bg-white text-[#111111] font-bold text-[22px] hover:bg-gray-100 transition-colors shadow-lg focus:outline-none focus:ring-4 focus:ring-white/50"
                            >
                                <Monitor size={28} className="text-[#111111]" /> Iniciar
                            </button>
                            <button
                                aria-label="Repetir mensaje de bienvenida"
                                onClick={() => { if (avatarRef.current) { avatarRef.current.replay(); setVideoEnded(false); speech.stopListening(); } }}
                                className="flex items-center justify-center gap-4 w-full min-h-[64px] py-5 rounded-xl bg-white text-[#111111] font-bold text-[22px] hover:bg-gray-100 transition-colors shadow-lg focus:outline-none focus:ring-4 focus:ring-white/50"
                            >
                                <RefreshCw size={28} className="text-[#111111]" /> Repetir
                            </button>
                            <button
                                aria-label="Salir de la aplicación"
                                data-action="back"
                                onClick={() => send({ type: EVENTS.EXIT })}
                                className="flex items-center justify-center gap-4 w-full min-h-[64px] py-5 rounded-xl bg-white text-[#111111] font-bold text-[22px] hover:bg-gray-100 transition-colors shadow-lg focus:outline-none focus:ring-4 focus:ring-white/50"
                            >
                                <LogOut size={28} className="text-[#111111]" /> Salir
                            </button>
                        </div>
                    </div>
                );

            case STATES.LOGIN:
                return (
                    <>
                        {(!context.subState || context.showAsesorPrompt) && (
                            <BiometricLogin
                                onSuccess={(userData) => send({ type: EVENTS.BIO_SUCCESS, userData, inputMode: session.inputMode })}
                                onFail={() => send({ type: EVENTS.BIO_FAIL, inputMode: session.inputMode })}
                                reintentosBio={context.reintentosBio}
                                showAsesorPrompt={context.showAsesorPrompt}
                                onAsesorYes={() => send({ type: EVENTS.ASESOR_YES })}
                                onAsesorNo={() => send({ type: EVENTS.ASESOR_NO })}
                                modoAccesible={isAccessible}
                                inputMode={session.inputMode}
                            />
                        )}
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
                        {!isVoice && <div className="text-duoc-yellow mb-6 drop-shadow-sm"><HelpCircle size={56} /></div>}
                        {!isVoice && <h2 className="text-4xl font-black text-white mb-8 drop-shadow-md">Confirmar Trámite</h2>}

                        <div className="a11y-inner-card flex flex-col items-start gap-2 bg-[#FFFFFF] border-2 border-transparent rounded-xl p-6 shadow-md w-full max-w-2xl mx-auto mb-8 hover:border-gray-300 transition-all text-left min-h-[48px]">
                            <span className="a11y-badge-num inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 text-[#111111] font-bold text-[18px] mb-1">{tramite?.id}</span>
                            <h3 className="text-[20px] font-bold text-[#111111] leading-tight">{tramite?.nombre}</h3>
                            <p className="text-[16px] font-medium text-[#222222] mt-1">{tramite?.descripcion}</p>
                        </div>

                        {!isVoice && renderSubtitle(subtitle)}
                        {renderVoiceYesNo('Di "sí" o "no"')}

                        {!isVoice && (
                            <div className="flex flex-col gap-4 w-full mt-6 px-12" role="group" aria-label="Confirmar o cancelar trámite">
                                <button aria-label="Sí, confirmar trámite" data-action="primary" className="flex items-center justify-center gap-4 px-8 py-6 rounded-xl bg-white border border-gray-300 text-[#111111] font-bold text-[24px] hover:bg-gray-100 transition-colors shadow-sm focus:outline-none focus:ring-4 focus:ring-gray-200" onClick={() => send({ type: EVENTS.CONFIRM_YES })}>
                                    <CheckCircle size={32} className="text-[#111111]" /> Sí, continuar
                                </button>
                                <button aria-label="No, volver al menú principal" data-action="back" className="flex items-center justify-center gap-4 px-8 py-6 rounded-xl bg-white border border-gray-300 text-[#111111] font-bold text-[24px] hover:bg-gray-100 transition-colors shadow-sm focus:outline-none focus:ring-4 focus:ring-gray-200" onClick={() => send({ type: EVENTS.CONFIRM_NO })}>
                                    <ArrowLeft size={32} className="text-[#111111]" /> No, volver al menú
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
                            {!isVoice && <div className="text-red-500 mb-6 drop-shadow-sm"><AlertTriangle size={56} /></div>}
                            {!isVoice && <h2 className="text-4xl font-black text-white mb-8 drop-shadow-md">Error en el trámite</h2>}
                            {!isVoice && renderSubtitle(subtitle)}
                            {renderVoiceYesNo('Di "sí" o "no"')}
                            {!isVoice && (
                                <div className="flex flex-col gap-4 w-full mt-6 px-12" role="group" aria-label="Reintentar o cancelar">
                                    <button aria-label="Sí, reintentar trámite" data-action="primary" className="flex items-center justify-center gap-4 px-8 py-6 rounded-xl bg-white border border-gray-300 text-[#111111] font-bold text-[24px] hover:bg-gray-100 transition-colors shadow-sm focus:outline-none focus:ring-4 focus:ring-gray-200" onClick={() => send({ type: EVENTS.RETRY_YES })}>
                                        <RefreshCw size={32} className="text-[#111111]" /> Sí, reintentar
                                    </button>
                                    <button aria-label="No, volver al menú" data-action="back" className="flex items-center justify-center gap-4 px-8 py-6 rounded-xl bg-white border border-gray-300 text-[#111111] font-bold text-[24px] hover:bg-gray-100 transition-colors shadow-sm focus:outline-none focus:ring-4 focus:ring-gray-200" onClick={() => send({ type: EVENTS.RETRY_NO })}>
                                        <ArrowLeft size={32} className="text-[#111111]" /> No, volver al menú
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                }
                return (
                    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto text-center">
                        <div className="text-duoc-yellow-dark mb-8 animate-spin drop-shadow-sm"><Settings size={64} /></div>
                        <h2 className="text-3xl font-black text-white mb-10 tracking-wide drop-shadow-md">Procesando trámite...</h2>
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
                        {!isVoice && <div className="text-green-500 mb-4 drop-shadow-sm"><CheckCircle2 size={56} /></div>}
                        {!isVoice && <h2 className="text-4xl font-black text-white mb-8 drop-shadow-md">Trámite Exitoso</h2>}
                        <ResultCard tramiteId={context.selectedTramite} resultado={tramiteResultText} userData={context.userData} />

                        <div className="mt-8 w-full max-w-2xl mx-auto">
                            {!isVoice && renderSubtitle(subtitle)}
                            {renderVoiceYesNo('Di "sí" o "no"')}
                            {!isVoice && (
                                <div className="flex flex-col gap-4 w-full mt-6 px-12" role="group" aria-label="Más trámites o finalizar">
                                    <button aria-label="Sí, realizar otro trámite" data-action="primary" className="flex items-center justify-center gap-4 px-8 py-6 rounded-xl bg-white border border-gray-300 text-[#111111] font-bold text-[24px] hover:bg-gray-100 transition-colors shadow-sm focus:outline-none focus:ring-4 focus:ring-gray-200" onClick={() => send({ type: EVENTS.MORE_YES })}>
                                        <CheckCircle size={32} className="text-[#111111]" /> Sí, otro trámite
                                    </button>
                                    <button aria-label="No, finalizar sesión" data-action="back" className="flex items-center justify-center gap-4 px-8 py-6 rounded-xl bg-white border border-gray-300 text-[#111111] font-bold text-[24px] hover:bg-gray-100 transition-colors shadow-sm focus:outline-none focus:ring-4 focus:ring-gray-200" onClick={() => send({ type: EVENTS.MORE_NO })}>
                                        <Hand size={32} className="text-[#111111]" /> No, finalizar
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
                        {!isVoice && <h2 className="text-5xl font-black text-white mb-8 drop-shadow-md">Fue un placer ayudarte. ¡Hasta pronto!</h2>}
                        {!isVoice && renderSubtitle(subtitle)}
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
                        {!isVoice && <h2 className="text-5xl font-black text-white mb-6 drop-shadow-md">¿Sigues ahí?</h2>}
                        {!isVoice && renderSubtitle(subtitle)}
                        {renderVoiceYesNo('Di "sí" para continuar')}
                        <div className="flex flex-col gap-4 w-full mt-6 px-12" role="group" aria-label="Continuar o salir">
                            <button aria-label="Sí, continuar con la sesión" data-action="primary" className="flex items-center justify-center gap-4 px-8 py-6 rounded-xl bg-white border border-gray-300 text-[#111111] font-bold text-[24px] hover:bg-gray-100 transition-colors shadow-sm focus:outline-none focus:ring-4 focus:ring-gray-200" onClick={() => send({ type: EVENTS.CONTINUE })}>
                                <CheckCircle size={32} className="text-[#111111]" /> Sí, continuar
                            </button>
                            <button aria-label="No, cerrar sesión" data-action="back" className="flex items-center justify-center gap-4 px-8 py-6 rounded-xl bg-white border border-gray-300 text-[#111111] font-bold text-[24px] hover:bg-gray-100 transition-colors shadow-sm focus:outline-none focus:ring-4 focus:ring-gray-200" onClick={() => send({ type: EVENTS.EXIT })}>
                                <LogOut size={32} className="text-[#111111]" /> No, salir
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
            <div
                className="w-[1080px] h-[1920px] overflow-hidden bg-white flex flex-col items-center justify-center relative"
                onClick={() => send({ type: EVENTS.DETECT_USER })}
            >
                {!idleCameraError && (
                    <>
                        {/* THE ACTUAL WEBCAM FEED INVISIBLE FOR TF.JS */}
                        <video ref={idleVideoRef} autoPlay playsInline muted
                            className="absolute opacity-0 w-[1px] h-[1px] pointer-events-none" />

                        {/* Seamless Loop Video Background for IDLE */}
                        <SeamlessLoopVideo
                            src="/videos/reposo_deteccion.mp4"
                            className="absolute inset-0 w-full h-full opacity-50"
                        />

                        {/* Clear gradient overlay to make text pop */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-white/70 to-white/95" />

                        {/* Face detection radar effect */}
                        {detectingFace && (
                            <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] border-4 border-duoc-yellow/60 rounded-full animate-ping" />
                        )}
                    </>
                )}

                {/* FOREGROUND CONTENT - CENTERED */}
                <div className="absolute top-[50%] -translate-y-[50%] left-0 right-0 z-10 flex flex-col items-center justify-center text-center px-16">
                    {/* Official DUOC UC Logo */}
                    <img
                        src="/logo-duoc.png"
                        alt="DUOC UC"
                        className="h-[120px] object-contain mb-8"
                        style={{ filter: 'brightness(0)' }} // Ensures the logo is black/dark
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />

                    {/* Secondary Text in BLACK */}
                    <div className="text-[2rem] uppercase tracking-[0.4em] font-black text-black">
                        Tótem de Autoatención
                    </div>

                    {/* Deteccing Face Indicator in BLACK */}
                    {detectingFace && (
                        <div className="flex items-center gap-4 border-2 border-gray-200 font-bold text-[1.6rem] text-black bg-white/90 backdrop-blur-sm px-10 py-5 rounded-full shadow-lg mt-16 transition-all duration-300">
                            <span className="w-5 h-5 bg-green-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.6)]" />
                            Detectando rostro...
                        </div>
                    )}
                </div>
            </div >
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
        <div className={`w-[1080px] h-[1920px] bg-black relative overflow-hidden font-sans select-none ${accessibilityClasses}`}
            onClick={() => session.resetTimer()}
        >
            {/* TIMEOUT BAR */}
            {session.timerActive && (
                <div className="absolute top-0 left-0 right-0 h-2 z-50">
                    <div className="h-full bg-gradient-to-r from-duoc-yellow to-red-500 transition-all duration-1000"
                        style={{ width: `${timeoutPct}%` }} />
                </div>
            )}

            {/* 1. VIDEO DE FONDO A PANTALLA COMPLETA */}
            <div className="absolute inset-0 z-0 bg-black">
                {((isTouch || isAccessible) && currentState !== STATES.WELCOME) ? (
                    <img src="/imagen-pantalla.jpeg" alt="Fondo" className="absolute inset-0 w-full h-full object-cover z-0" />
                ) : (
                    <VideoAvatar
                        ref={avatarRef}
                        src={videoSrc}
                        onEnded={handleVideoEnded}
                        onPlayError={() => setAutoplayBlocked(true)}
                    />
                )}
                {/* Gradiente sutil abajo para que destaquen textos blancos / botones */}
                <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />
                {/* Gradiente sutil arriba para el header */}
                <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/50 to-transparent pointer-events-none" />
            </div>

            {/* 2. CAPAS FRONTALES E INTERACTIVAS */}
            <div className={`relative z-10 w-full h-full flex flex-col justify-between transition-opacity duration-300 ${autoplayBlocked ? 'opacity-30 blur-sm pointer-events-none' : 'opacity-100'}`}>

                {/* ZONA SUPERIOR - HEADER FLOTANTE */}
                <div className="w-full px-12 pt-12 flex items-start justify-between">
                    <div>
                        <div className="text-[1.5rem] uppercase tracking-[0.25em] font-black text-white drop-shadow-sm">Tótem de Autoatención</div>
                        {session.timerActive && session.timeRemaining <= 30 && (
                            <div className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 backdrop-blur-md text-[1rem] font-bold ${session.timeRemaining <= 15 ? 'bg-red-500/80 text-white animate-pulse' : 'bg-black/30 text-white'}`}>
                                <Clock size={18} /> {session.timeRemaining}s
                            </div>
                        )}
                    </div>
                    {currentState === STATES.WELCOME && (
                        <button
                            onClick={(e) => { e.stopPropagation(); session.setInputMode('ACCESSIBLE'); session.setModoAccesible(true); send({ type: EVENTS.ACCESSIBILITY }); }}
                            className="flex items-center gap-3 px-6 py-4 rounded-full bg-black/40 border border-white/20 backdrop-blur-md text-white font-bold text-[1.2rem] hover:bg-black/60 transition-colors shadow-lg"
                            aria-label="Menú de accesibilidad"
                        >
                            <Accessibility size={24} /> Accesibilidad
                        </button>
                    )}
                </div>




                {/* ZONA INFERIOR - INTERACCIÓN Y CONTROLES */}
                <div className="w-full flex-col flex justify-end pb-8">

                    {/* Subtítulos */}
                    <div className="w-full flex justify-center px-12 mb-8">
                        {subtitle && !isTouch && !isAccessible && (
                            <div className="w-full max-w-[800px]">
                                <div className={`text-[1.3rem] font-bold text-white drop-shadow-xl leading-relaxed bg-black/50 px-8 py-6 rounded-3xl backdrop-blur-md border border-white/10 ${subtitle.includes('\n') ? 'text-left' : 'text-center'}`} style={{ whiteSpace: 'pre-line' }}>
                                    {subtitle}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Botones y Vistas dinámicas */}
                    <div className="w-full px-12 mb-10 flex flex-col items-center">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentState}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                                className="w-full flex flex-col items-center gap-5"
                            >
                                {isAccessible && currentState !== STATES.LOGIN && currentState !== STATES.WELCOME
                                    ? <div className="bg-white rounded-[3rem] p-10 w-full shadow-2xl border border-gray-200 a11y-card">
                                        <AccessibleMode currentState={currentState}>{renderContent()}</AccessibleMode>
                                    </div>
                                    : renderContent()
                                }
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* FOOTER - Logo fijo abajo */}
                    <div className="w-full px-12 flex flex-col items-center justify-center opacity-90 mt-4 relative">
                        <img
                            src="/logo-duoc.png"
                            alt="DUOC UC"
                            className="h-12 object-contain"
                            style={{ filter: 'brightness(0) invert(1)' }} // Logo en blanco
                            onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <div className="absolute right-12 flex items-center gap-4">
                            {session.inputMode && (
                                <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl text-white/90 text-[0.9rem] font-semibold border border-white/10">
                                    {isVoice && <><Mic size={14} /> Voz</>}
                                    {isTouch && <><Monitor size={14} /> Táctil</>}
                                    {isAccessible && !isTouch && <><Accessibility size={14} /> Accesible</>}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* OVERLAY: CHROME AUTOPLAY BLOCKED */}
            <AnimatePresence>
                {autoplayBlocked && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => {
                            setAutoplayBlocked(false);
                            if (avatarRef.current) {
                                avatarRef.current.replay();
                                setVideoEnded(false);
                            }
                        }}
                        className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md cursor-pointer"
                    >
                        <div className="bg-white/10 border border-white/20 p-12 rounded-[3rem] flex flex-col items-center text-center max-w-2xl shadow-2xl">
                            <div className="w-24 h-24 bg-duoc-yellow rounded-full flex items-center justify-center mb-8 animate-bounce shadow-[0_0_30px_rgba(251,191,36,0.5)]">
                                <Hand size={48} className="text-black" />
                            </div>
                            <h2 className="text-4xl font-black text-white mb-4 drop-shadow-md">Atención requerida</h2>
                            <p className="text-2xl text-white/90 leading-relaxed drop-shadow-sm font-medium">
                                Por políticas de seguridad del navegador, <strong>toca la pantalla una vez</strong> para habilitar el sonido e interactuar con Leonor.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
