// Máquina de estados pura para el tótem DUOC UC
// Sin frameworks — solo funciones puras

export const STATES = {
    IDLE: 'IDLE',
    WELCOME: 'WELCOME',
    LOGIN: 'LOGIN',
    ACCESSIBILITY_SETUP: 'ACCESSIBILITY_SETUP', // New state for UserWay clone menu
    MENU: 'MENU',
    SUB_MENU_ASESOR: 'SUB_MENU_ASESOR', // Nuevo estado Fase 1: Selección de Especialidad
    CONFIRMING: 'CONFIRMING',
    EXECUTING: 'EXECUTING',
    RESULT: 'RESULT',
    GOODBYE: 'GOODBYE',
    INACTIVITY: 'INACTIVITY'
};

export const EVENTS = {
    DETECT_USER: 'DETECT_USER',
    START: 'START',
    ACCESSIBILITY: 'ACCESSIBILITY',
    REPEAT: 'REPEAT',
    EXIT: 'EXIT',
    BIO_SUCCESS: 'BIO_SUCCESS',
    BIO_FAIL: 'BIO_FAIL',
    SELECT_OPTION: 'SELECT_OPTION',
    SELECT_ASESOR_SUB_OPTION: 'SELECT_ASESOR_SUB_OPTION', // Selección (Academico, Práctica, Inclusión, Financiero)
    CONFIRM_YES: 'CONFIRM_YES',
    CONFIRM_NO: 'CONFIRM_NO',
    EXECUTE_SUCCESS: 'EXECUTE_SUCCESS',
    EXECUTE_FAIL: 'EXECUTE_FAIL',
    RETRY_YES: 'RETRY_YES',
    RETRY_NO: 'RETRY_NO',
    MORE_YES: 'MORE_YES',
    MORE_NO: 'MORE_NO',
    ASESOR_YES: 'ASESOR_YES',
    ASESOR_NO: 'ASESOR_NO',
    TIMEOUT: 'TIMEOUT',
    VIDEO_ENDED: 'VIDEO_ENDED',
    NOT_UNDERSTOOD: 'NOT_UNDERSTOOD',
    CONTINUE: 'CONTINUE',         // Resume from INACTIVITY
    INACTIVITY_TIMEOUT: 'INACTIVITY_TIMEOUT', // 30s timer expired in INACTIVITY
    FINISH_ACCESSIBILITY_SETUP: 'FINISH_ACCESSIBILITY_SETUP' // Event to exit accessibility setup
};

export function createInitialContext() {
    return {
        accionesExitosas: 0,
        reintentosBio: 0,
        modoAccesible: false,
        selectedTramite: null,
        tramiteResult: null,
        retryCount: 0,
        showAsesorPrompt: false,
        showRetryPrompt: false,
        ticketNumber: null,
        subState: null,        // for sub-flows like 'bio_failed', 'asesor_prompt', etc.
        previousState: null    // saved state before INACTIVITY
    };
}

export function transition(currentState, event, context) {
    const newContext = { ...context };

    switch (currentState) {
        // ─── IDLE ───
        case STATES.IDLE:
            if (event.type === EVENTS.DETECT_USER) {
                return { state: STATES.WELCOME, context: { ...createInitialContext() } };
            }
            return { state: currentState, context };

        // ─── WELCOME ───
        case STATES.WELCOME:
            switch (event.type) {
                case EVENTS.START:
                    return { state: STATES.LOGIN, context: newContext };
                case EVENTS.ACCESSIBILITY:
                    newContext.modoAccesible = true;
                    return { state: STATES.LOGIN, context: newContext };
                case EVENTS.REPEAT:
                    newContext.subState = 'repeat';
                    return { state: STATES.WELCOME, context: newContext };
                case EVENTS.EXIT:
                case EVENTS.TIMEOUT:
                    return { state: STATES.IDLE, context: createInitialContext() };
                default:
                    return { state: currentState, context };
            }

        // ─── LOGIN ───
        case STATES.LOGIN:
            switch (event.type) {
                case EVENTS.BIO_SUCCESS:
                    newContext.subState = 'login_success';
                    if (event.userData) {
                        newContext.userData = event.userData;
                    }
                    if (event.inputMode === 'TOUCH' || event.inputMode === 'ACCESSIBLE') {
                        if (newContext.modoAccesible) {
                            return { state: STATES.ACCESSIBILITY_SETUP, context: newContext };
                        }
                        return { state: STATES.MENU, context: newContext };
                    }
                    // Wait for VIDEO_ENDED before transitioning out
                    return { state: STATES.LOGIN, context: newContext };
                case EVENTS.VIDEO_ENDED:
                    if (newContext.subState === 'login_success') {
                        if (newContext.modoAccesible) {
                            return { state: STATES.ACCESSIBILITY_SETUP, context: newContext };
                        }
                        return { state: STATES.MENU, context: newContext };
                    }
                    if (newContext.subState === 'bio_failed') {
                        newContext.subState = null; // Resume face scanning
                        return { state: STATES.LOGIN, context: newContext };
                    }
                    return { state: currentState, context };
                case EVENTS.BIO_FAIL:
                    newContext.reintentosBio += 1;
                    if (newContext.reintentosBio >= 2) {
                        newContext.subState = 'asesor_prompt';
                        newContext.showAsesorPrompt = true;
                        return { state: STATES.LOGIN, context: newContext };
                    }
                    newContext.subState = 'bio_failed';
                    if (event.inputMode === 'TOUCH' || event.inputMode === 'ACCESSIBLE') {
                        newContext.subState = null; // En modo pantalla interactiva se salta el video y sigue scaneando
                    }
                    return { state: STATES.LOGIN, context: newContext };
                case EVENTS.ASESOR_YES:
                    newContext.ticketNumber = generateTicket();
                    return { state: STATES.GOODBYE, context: newContext };
                case EVENTS.ASESOR_NO:
                case EVENTS.EXIT:
                    return { state: STATES.IDLE, context: createInitialContext() };
                case EVENTS.TIMEOUT:
                    newContext.previousState = STATES.LOGIN;
                    return { state: STATES.INACTIVITY, context: newContext };
                default:
                    return { state: currentState, context };
            }

        // ─── ACCESSIBILITY SETUP ───
        case STATES.ACCESSIBILITY_SETUP:
            switch (event.type) {
                case EVENTS.FINISH_ACCESSIBILITY_SETUP:
                    return { state: STATES.MENU, context: newContext };
                case EVENTS.EXIT:
                    return { state: STATES.GOODBYE, context: newContext };
                case EVENTS.TIMEOUT:
                    newContext.previousState = STATES.ACCESSIBILITY_SETUP;
                    return { state: STATES.INACTIVITY, context: newContext };
                default:
                    return { state: currentState, context };
            }

        // ─── MENU ───
        case STATES.MENU:
            switch (event.type) {
                case EVENTS.SELECT_OPTION: {
                    const option = event.option;
                    newContext.subState = null; // ALWAYS clear subState on successful action
                    if (option === 0) {
                        // En la Fase 1 ya no da ticket inmediato. Pasa a Sub-Menú de Especialidad.
                        return { state: STATES.SUB_MENU_ASESOR, context: newContext };
                    }
                    if (option >= 1 && option <= 4) {
                        newContext.selectedTramite = option;
                        newContext.retryCount = 0;
                        return { state: STATES.CONFIRMING, context: newContext };
                    }
                    return { state: currentState, context };
                }
                case EVENTS.NOT_UNDERSTOOD:
                    newContext.subState = 'not_understood';
                    newContext.errorTick = Date.now();
                    return { state: STATES.MENU, context: newContext };
                case EVENTS.EXIT:
                    return { state: STATES.GOODBYE, context: newContext };
                case EVENTS.TIMEOUT:
                    newContext.previousState = STATES.MENU;
                    return { state: STATES.INACTIVITY, context: newContext };
                default:
                    return { state: currentState, context };
            }

        // ─── SUB_MENU ASESOR (Fase 1) ───
        case STATES.SUB_MENU_ASESOR:
            switch (event.type) {
                case EVENTS.SELECT_ASESOR_SUB_OPTION: {
                    newContext.subState = null; // Clear subState
                    newContext.asesorPrefix = event.prefix;
                    newContext.ticketNumber = generateTicket(event.prefix); // fallback local
                    return { state: STATES.GOODBYE, context: newContext };
                }
                case EVENTS.EXIT:
                    return { state: STATES.GOODBYE, context: newContext };
                case EVENTS.TIMEOUT:
                    newContext.previousState = STATES.SUB_MENU_ASESOR;
                    return { state: STATES.INACTIVITY, context: newContext };
                case EVENTS.CONFIRM_NO: // Para volver al menú principal
                    return { state: STATES.MENU, context: newContext };
                case EVENTS.NOT_UNDERSTOOD:
                    newContext.subState = 'not_understood';
                    newContext.errorTick = Date.now();
                    return { state: STATES.SUB_MENU_ASESOR, context: newContext };
                default:
                    return { state: currentState, context };
            }

        // ─── CONFIRMING ───
        case STATES.CONFIRMING:
            switch (event.type) {
                case EVENTS.CONFIRM_YES:
                    return { state: STATES.EXECUTING, context: newContext };
                case EVENTS.CONFIRM_NO:
                    newContext.selectedTramite = null;
                    newContext.subState = null;
                    return { state: STATES.MENU, context: newContext };
                case EVENTS.EXIT:
                    return { state: STATES.GOODBYE, context: newContext };
                case EVENTS.TIMEOUT:
                    newContext.previousState = STATES.CONFIRMING;
                    return { state: STATES.INACTIVITY, context: newContext };
                default:
                    return { state: currentState, context };
            }

        // ─── EXECUTING ───
        case STATES.EXECUTING:
            switch (event.type) {
                case EVENTS.EXECUTE_SUCCESS:
                    newContext.accionesExitosas += 1;
                    newContext.documentoPdf = event.base64; // <-- AÑADIDO
                    newContext.subState = null;
                    return { state: STATES.RESULT, context: newContext };
                case EVENTS.EXECUTE_FAIL:
                    if (newContext.retryCount < 1) {
                        newContext.retryCount += 1;
                        newContext.showRetryPrompt = true;
                        newContext.subState = 'retry_prompt';
                        return { state: STATES.EXECUTING, context: newContext };
                    }
                    newContext.subState = 'final_fail';
                    newContext.selectedTramite = null;
                    newContext.showRetryPrompt = false;
                    return { state: STATES.MENU, context: newContext };
                case EVENTS.RETRY_YES:
                    newContext.showRetryPrompt = false;
                    newContext.subState = 'retrying';
                    return { state: STATES.EXECUTING, context: newContext };
                case EVENTS.RETRY_NO:
                    newContext.showRetryPrompt = false;
                    newContext.selectedTramite = null;
                    newContext.subState = null;
                    return { state: STATES.MENU, context: newContext };
                default:
                    return { state: currentState, context };
            }

        // ─── RESULT ───
        case STATES.RESULT:
            switch (event.type) {
                case EVENTS.MORE_YES:
                    if (newContext.accionesExitosas >= 4) {
                        newContext.subState = 'max_actions';
                        newContext.ticketNumber = generateTicket();
                        return { state: STATES.GOODBYE, context: newContext };
                    }
                    newContext.selectedTramite = null;
                    newContext.subState = null;
                    return { state: STATES.MENU, context: newContext };
                case EVENTS.MORE_NO:
                    return { state: STATES.GOODBYE, context: newContext };
                case EVENTS.TIMEOUT:
                    newContext.previousState = STATES.RESULT;
                    return { state: STATES.INACTIVITY, context: newContext };
                default:
                    return { state: currentState, context };
            }

        // ─── GOODBYE ───
        case STATES.GOODBYE:
            if (event.type === EVENTS.VIDEO_ENDED || event.type === EVENTS.TIMEOUT) {
                return { state: STATES.IDLE, context: createInitialContext() };
            }
            return { state: currentState, context };

        // ─── INACTIVITY ───
        case STATES.INACTIVITY:
            switch (event.type) {
                case EVENTS.CONTINUE:
                    // Return to previous state
                    newContext.previousState = null;
                    return { state: context.previousState || STATES.MENU, context: newContext };
                case EVENTS.INACTIVITY_TIMEOUT:
                    return { state: STATES.IDLE, context: createInitialContext() };
                case EVENTS.EXIT:
                    return { state: STATES.IDLE, context: createInitialContext() };
                default:
                    return { state: currentState, context };
            }

        default:
            return { state: currentState, context };
    }
}

function generateTicket(prefix = 'ASE') {
    const num = Math.floor(Math.random() * 900) + 100; // Ej: 104, 305
    return `${prefix}-${num}`;
}
