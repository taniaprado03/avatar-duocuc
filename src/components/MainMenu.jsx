import { useState } from 'react';
import TRAMITES from '../constants/tramites';
import { HelpCircle, Loader, Users, ClipboardList } from 'lucide-react';

const MENU_SUBTITLE = '¿En qué puedo ayudarte hoy? Di uno para Certificado de Alumno Regular, dos para Progreso Académico, tres para Ver Horario, cuatro para Situación Financiera, o cero para ser atendido por un asesor académico.';

export default function MainMenu({ onSelectOption, isListening, transcript, modoAccesible, isProcessingVoice, inputMode, menuVideoEnded, userData }) {
    const [showHelpButtons, setShowHelpButtons] = useState(false);

    // ─── VOICE mode ───
    if (inputMode === 'VOICE') {
        return (
            <div className="flex flex-col items-center w-full max-w-3xl">

                {menuVideoEnded && (
                    <div className="flex flex-col items-center mt-6 gap-4">
                        {isProcessingVoice ? (
                            <div className="flex items-center gap-3 bg-[#FFFFFF] px-6 py-3 rounded-xl border border-gray-300 text-[#111111] font-bold text-[18px] shadow-sm min-h-[48px]">
                                <Loader size={20} className="animate-spin text-duoc-yellow" />
                                <span>Procesando tu respuesta...</span>
                            </div>
                        ) : isListening ? (
                            <div className="flex items-center gap-4 bg-[#FFFFFF] border border-gray-300 px-6 py-3 rounded-xl text-[#111111] font-bold text-[18px] shadow-sm min-h-[48px]">
                                <div className="flex items-end gap-1 h-6">
                                    <span className="w-1.5 bg-duoc-yellow rounded-full animate-[voiceBar_1s_ease-in-out_infinite] h-[40%]" />
                                    <span className="w-1.5 bg-duoc-yellow rounded-full animate-[voiceBar_1.2s_ease-in-out_infinite_0.1s] h-[80%]" />
                                    <span className="w-1.5 bg-duoc-yellow rounded-full animate-[voiceBar_0.9s_ease-in-out_infinite_0.2s] h-[60%]" />
                                    <span className="w-1.5 bg-duoc-yellow rounded-full animate-[voiceBar_1.1s_ease-in-out_infinite_0.3s] h-[100%]" />
                                    <span className="w-1.5 bg-duoc-yellow rounded-full animate-[voiceBar_1s_ease-in-out_infinite_0.4s] h-[50%]" />
                                </div>
                                <span>Escuchando... di tu opción</span>
                            </div>
                        ) : null}
                        {transcript && (
                            <div className="px-6 py-3 bg-[#FFFFFF] border border-gray-300 rounded-xl text-[#111111] font-bold text-[18px] max-w-md text-center mt-2 shadow-sm min-h-[48px]">
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
                        className="mt-8 flex items-center justify-center gap-2 px-6 py-4 bg-white border border-gray-300 rounded-xl text-[#111111] font-bold text-[18px] hover:bg-gray-50 transition-colors shadow-sm min-h-[48px]"
                        onClick={() => setShowHelpButtons(true)}
                    >
                        <HelpCircle size={20} className="text-[#111111]" /> ¿Necesitas ayuda?
                    </button>
                )}

                {showHelpButtons && (
                    <div className="w-full mt-8 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <p className="text-gray-500 uppercase tracking-widest text-xs font-bold mb-4">Selecciona con botones:</p>
                        <div className="grid grid-cols-2 gap-3 w-full max-w-2xl mb-3">
                            {TRAMITES.map((tramite) => (
                                <button
                                    key={tramite.id}
                                    className="flex items-center gap-3 p-4 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all shadow-sm min-h-[48px] text-left"
                                    onClick={() => onSelectOption(tramite.id)}
                                >
                                    <span className="a11y-badge-num shrink-0 flex items-center justify-center w-8 h-8 rounded-md bg-gray-100 border border-gray-300 text-[#111111] font-bold">{tramite.id}</span>
                                    <span className="font-bold text-[18px] text-[#111111] leading-tight">{tramite.nombre}</span>
                                </button>
                            ))}
                        </div>
                        <button className="w-full max-w-2xl flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-white border border-gray-300 text-[#111111] font-bold text-[18px] hover:bg-gray-50 transition-colors shadow-sm min-h-[48px]" onClick={() => onSelectOption(0)}>
                            <Users size={22} className="text-[#111111]" /> Hablar con un asesor (0)
                        </button>
                    </div>
                )}
            </div>
        );
    }

    // ─── TOUCH / ACCESSIBLE mode — NO subtitle, just title + cards ───
    return (
        <div className="flex flex-col items-center w-full max-w-4xl">
            <div className="text-white mb-4 drop-shadow-sm"><ClipboardList size={48} /></div>
            {userData?.nombre ? (
                <h2 className="text-3xl md:text-5xl font-black text-white text-center mb-10 drop-shadow-sm">¡Hola {userData.nombre}!<br /><span className="text-2xl opacity-90">¿En qué puedo ayudarte hoy?</span></h2>
            ) : (
                <h2 className="text-3xl md:text-5xl font-black text-white text-center mb-10 drop-shadow-sm">¿En qué puedo ayudarte hoy?</h2>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-6 relative z-10">
                {TRAMITES.map((tramite) => (
                    <button
                        key={tramite.id}
                        className="group flex flex-col items-start gap-2 p-6 bg-[#FFFFFF] border-2 border-transparent hover:border-gray-300 rounded-xl hover:bg-gray-50 transition-all shadow-md text-left min-h-[48px]"
                        onClick={() => onSelectOption(tramite.id)}
                    >
                        <span className="a11y-badge-num inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 text-[#111111] font-bold text-[18px] mb-1">{tramite.id}</span>
                        <span className="text-[20px] font-bold text-[#111111] leading-tight">{tramite.nombre}</span>
                        <span className="text-[16px] font-medium text-[#222222] mt-1 line-clamp-2">{tramite.descripcion}</span>
                    </button>
                ))}
            </div>

            <button className="w-full relative z-10 flex items-center justify-center gap-3 px-8 py-6 rounded-xl bg-[#FFFFFF] border-2 border-transparent hover:border-gray-300 hover:bg-gray-50 text-[#111111] font-bold text-[22px] transition-colors shadow-md min-h-[48px]" onClick={() => onSelectOption(0)}>
                <Users size={28} className="text-[#111111]" /> Hablar con un asesor
            </button>
        </div>
    );
}
