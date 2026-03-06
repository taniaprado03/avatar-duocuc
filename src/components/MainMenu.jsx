import { useState } from 'react';
import TRAMITES from '../constants/tramites';
import { HelpCircle, Loader, Users, ClipboardList } from 'lucide-react';

const MENU_SUBTITLE = '¿En qué puedo ayudarte hoy? Di uno para Certificado de Alumno Regular, dos para Horario Académico, tres para Progreso Académico, cuatro para Situación Financiera, o cero para ser atendido por un asesor académico.';

export default function MainMenu({ onSelectOption, isListening, transcript, modoAccesible, isProcessingVoice, inputMode, menuVideoEnded, userData }) {
    const [showHelpButtons, setShowHelpButtons] = useState(false);

    // ─── VOICE mode ───
    if (inputMode === 'VOICE') {
        return (
            <div className="flex flex-col items-center w-full max-w-3xl">
                {userData?.nombre && (
                    <h2 className="text-4xl md:text-5xl font-black text-duoc-blue text-center mb-6 drop-shadow-sm">
                        ¡Hola {userData.nombre}!
                    </h2>
                )}
                <div className="bg-white border border-gray-200 rounded-3xl px-8 py-5 mb-6 shadow-md text-center w-full">
                    <p className="text-xl md:text-2xl text-duoc-blue font-medium leading-relaxed drop-shadow-sm">{MENU_SUBTITLE}</p>
                </div>

                {menuVideoEnded && (
                    <div className="flex flex-col items-center mt-6 gap-4">
                        {isProcessingVoice ? (
                            <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-full border border-gray-200 text-duoc-blue font-medium shadow-sm">
                                <Loader size={20} className="animate-spin text-duoc-yellow" />
                                <span>Procesando tu respuesta...</span>
                            </div>
                        ) : isListening ? (
                            <div className="flex items-center gap-4 bg-duoc-blue/10 border border-duoc-blue/20 px-8 py-4 rounded-full text-duoc-blue font-bold shadow-sm">
                                <div className="flex items-end gap-1 h-6">
                                    <span className="w-1.5 bg-duoc-blue-light rounded-full animate-[voiceBar_1s_ease-in-out_infinite] h-[40%]" />
                                    <span className="w-1.5 bg-duoc-blue-light rounded-full animate-[voiceBar_1.2s_ease-in-out_infinite_0.1s] h-[80%]" />
                                    <span className="w-1.5 bg-duoc-blue-light rounded-full animate-[voiceBar_0.9s_ease-in-out_infinite_0.2s] h-[60%]" />
                                    <span className="w-1.5 bg-duoc-blue-light rounded-full animate-[voiceBar_1.1s_ease-in-out_infinite_0.3s] h-[100%]" />
                                    <span className="w-1.5 bg-duoc-blue-light rounded-full animate-[voiceBar_1s_ease-in-out_infinite_0.4s] h-[50%]" />
                                </div>
                                <span className="text-lg">Escuchando... di tu opción</span>
                            </div>
                        ) : null}
                        {transcript && (
                            <div className="px-6 py-3 bg-white border border-gray-200 rounded-2xl text-gray-800 font-medium max-w-md text-center text-lg mt-2 shadow-sm">
                                Escuché: &ldquo;<span className="text-duoc-blue font-bold">{transcript}</span>&rdquo;
                            </div>
                        )}
                    </div>
                )}

                {!menuVideoEnded && (
                    <p className="text-white/50 text-sm animate-pulse mt-4">Leonor está hablando...</p>
                )}

                {!showHelpButtons && (
                    <button
                        className="mt-8 flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 rounded-full text-gray-600 hover:bg-gray-50 hover:text-duoc-blue transition-colors shadow-sm"
                        onClick={() => setShowHelpButtons(true)}
                    >
                        <HelpCircle size={18} /> ¿Necesitas ayuda?
                    </button>
                )}

                {showHelpButtons && (
                    <div className="w-full mt-8 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <p className="text-gray-500 uppercase tracking-widest text-xs font-bold mb-4">Selecciona con botones:</p>
                        <div className="grid grid-cols-2 gap-3 w-full max-w-2xl mb-3">
                            {TRAMITES.map((tramite) => (
                                <button
                                    key={tramite.id}
                                    className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-2xl hover:border-duoc-yellow hover:-translate-y-1 transition-all shadow-sm hover:shadow-md text-left"
                                    onClick={() => onSelectOption(tramite.id)}
                                >
                                    <span className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 border border-gray-300 text-duoc-blue font-bold">{tramite.id}</span>
                                    <span className="font-semibold text-duoc-blue leading-tight">{tramite.nombre}</span>
                                </button>
                            ))}
                        </div>
                        <button className="w-full max-w-2xl flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-br from-duoc-yellow to-duoc-yellow-dark text-black font-bold text-lg hover:scale-[1.02] transition-transform shadow-[0_4px_20px_rgba(242,169,0,0.3)]" onClick={() => onSelectOption(0)}>
                            <Users size={22} /> Hablar con un asesor (0)
                        </button>
                    </div>
                )}
            </div>
        );
    }

    // ─── TOUCH / ACCESSIBLE mode — NO subtitle, just title + cards ───
    return (
        <div className="flex flex-col items-center w-full max-w-4xl">
            <div className="text-duoc-blue mb-4 drop-shadow-sm"><ClipboardList size={48} /></div>
            {userData?.nombre ? (
                <h2 className="text-3xl md:text-5xl font-black text-duoc-blue text-center mb-10 drop-shadow-sm">¡Hola {userData.nombre}!<br /><span className="text-2xl opacity-80">¿En qué te puedo ayudar?</span></h2>
            ) : (
                <h2 className="text-3xl md:text-5xl font-black text-duoc-blue text-center mb-10 drop-shadow-sm">¿En qué te puedo ayudar?</h2>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-6 relative z-10">
                {TRAMITES.map((tramite) => (
                    <button
                        key={tramite.id}
                        className="group flex flex-col items-start gap-2 p-6 bg-white border border-gray-200 rounded-2xl hover:border-duoc-yellow hover:-translate-y-1 transition-all shadow-sm hover:shadow-md text-left"
                        onClick={() => onSelectOption(tramite.id)}
                    >
                        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-duoc-yellow to-duoc-yellow-dark text-black font-black text-lg mb-1">{tramite.id}</span>
                        <span className="text-xl font-bold text-duoc-blue leading-tight">{tramite.nombre}</span>
                        <span className="text-sm text-gray-600 mt-1 line-clamp-2">{tramite.descripcion}</span>
                    </button>
                ))}
            </div>

            <button className="w-full relative z-10 flex items-center justify-center gap-3 px-8 py-6 rounded-2xl bg-gradient-to-br from-duoc-yellow to-duoc-yellow-dark text-black font-black text-2xl hover:scale-[1.02] transition-transform shadow-[0_8px_32px_rgba(242,169,0,0.4)]" onClick={() => onSelectOption(0)}>
                <Users size={28} /> Hablar con un asesor
            </button>
        </div>
    );
}
