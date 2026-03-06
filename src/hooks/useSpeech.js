import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * useSpeech — robust kiosk speech recognition hook
 *
 * Key design decisions for a kiosk:
 *  - continuous: false  (single utterance per session, more accurate)
 *  - shouldListenRef: persists intent across renders
 *  - Auto-restart on unexpected end while shouldListen = true
 *  - Minimum 400ms cooldown between start() calls to avoid InvalidStateError
 */
export function useSpeech() {
    const [transcript, setTranscript] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [isSupported, setIsSupported] = useState(true);

    const recognitionRef = useRef(null);
    const shouldListenRef = useRef(false);   // desired state
    const listeningRef = useRef(false);   // actual state of the API
    const cooldownRef = useRef(false);   // prevents rapid restart
    const onResultCbRef = useRef(null);    // latest onResult callback

    /* ─── initialise once ─── */
    useEffect(() => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) { setIsSupported(false); return; }

        const recognition = new SR();
        recognition.lang = 'es-CL';
        recognition.interimResults = true;    // show words as they are spoken
        recognition.maxAlternatives = 3;      // more alternatives = better accuracy
        recognition.continuous = true;        // keep listening without stopping

        recognition.onresult = (event) => {
            // Grab the latest result (could be interim or final)
            const lastResult = event.results[event.results.length - 1];
            const text = lastResult[0].transcript;

            if (lastResult.isFinal) {
                // Final confirmed result — pass it up
                setTranscript(text);
            } else {
                // Interim result — show it immediately for responsiveness
                setTranscript(text);
            }
        };

        recognition.onerror = (event) => {
            listeningRef.current = false;
            setIsListening(false);
            // "no-speech" and "aborted" are normal — restart if still desired
            if (shouldListenRef.current && event.error !== 'not-allowed') {
                scheduleRestart();
            }
        };

        recognition.onend = () => {
            listeningRef.current = false;
            setIsListening(false);
            // Auto-restart if intent is still to listen (e.g. no speech timeout)
            if (shouldListenRef.current) {
                scheduleRestart();
            }
        };

        recognitionRef.current = recognition;
        return () => {
            shouldListenRef.current = false;
            try { recognition.abort(); } catch (_) { }
        };
    }, []);

    function scheduleRestart() {
        if (cooldownRef.current || !shouldListenRef.current) return;
        cooldownRef.current = true;
        setTimeout(() => {
            cooldownRef.current = false;
            if (shouldListenRef.current && !listeningRef.current) {
                doStart();
            }
        }, 250);   // faster restart = less dead time between utterances
    }

    function doStart() {
        if (!recognitionRef.current) return;
        if (listeningRef.current) return;
        try {
            recognitionRef.current.start();
            listeningRef.current = true;
            setIsListening(true);
        } catch (e) {
            listeningRef.current = false;
            setIsListening(false);
            scheduleRestart();
        }
    }

    const startListening = useCallback(() => {
        shouldListenRef.current = true;
        setTranscript('');
        if (!listeningRef.current && !cooldownRef.current) {
            doStart();
        }
    }, []);

    const stopListening = useCallback(() => {
        shouldListenRef.current = false;
        if (!recognitionRef.current) return;
        try { recognitionRef.current.abort(); } catch (_) { }
        listeningRef.current = false;
        setIsListening(false);
    }, []);

    const resetTranscript = useCallback(() => {
        setTranscript('');
    }, []);

    return { transcript, isListening, isSupported, startListening, stopListening, resetTranscript };
}
