import { useState, useCallback, useRef, useEffect } from 'react';

const TIMEOUT_SECONDS = 120;

export function useSession(onTimeout) {
    const [accionesExitosas, setAccionesExitosas] = useState(0);
    const [reintentosBio, setReintentosBio] = useState(0);
    const [modoAccesible, setModoAccesible] = useState(false);
    const [inputMode, setInputMode] = useState(null); // 'VOICE' | 'TOUCH' | 'ACCESSIBLE' | null
    const [timeRemaining, setTimeRemaining] = useState(TIMEOUT_SECONDS);
    const [timerActive, setTimerActive] = useState(false);

    const timerRef = useRef(null);
    const countdownRef = useRef(null);
    const onTimeoutRef = useRef(onTimeout);

    useEffect(() => {
        onTimeoutRef.current = onTimeout;
    }, [onTimeout]);

    const clearTimers = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        if (countdownRef.current) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
        }
    }, []);

    const startTimer = useCallback(() => {
        clearTimers();
        setTimeRemaining(TIMEOUT_SECONDS);
        setTimerActive(true);

        countdownRef.current = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev <= 1) {
                    clearTimers();
                    setTimerActive(false);
                    if (onTimeoutRef.current) onTimeoutRef.current();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, [clearTimers]);

    const resetTimer = useCallback(() => {
        if (timerActive) {
            startTimer();
        }
    }, [timerActive, startTimer]);

    const stopTimer = useCallback(() => {
        clearTimers();
        setTimerActive(false);
        setTimeRemaining(TIMEOUT_SECONDS);
    }, [clearTimers]);

    const incrementAcciones = useCallback(() => {
        setAccionesExitosas((prev) => prev + 1);
    }, []);

    const incrementReintentos = useCallback(() => {
        setReintentosBio((prev) => prev + 1);
    }, []);

    const resetSession = useCallback(() => {
        setAccionesExitosas(0);
        setReintentosBio(0);
        setModoAccesible(false);
        setInputMode(null);
        stopTimer();
    }, [stopTimer]);

    // Cleanup on unmount
    useEffect(() => {
        return () => clearTimers();
    }, [clearTimers]);

    return {
        accionesExitosas,
        reintentosBio,
        modoAccesible,
        inputMode,
        timeRemaining,
        timerActive,
        setModoAccesible,
        setInputMode,
        incrementAcciones,
        incrementReintentos,
        startTimer,
        resetTimer,
        stopTimer,
        resetSession,
        TIMEOUT_SECONDS
    };
}
