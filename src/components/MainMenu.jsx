import { useState } from 'react';
import TRAMITES from '../constants/tramites';
import { HelpCircle, Loader, Users, ClipboardList } from 'lucide-react';

const MENU_SUBTITLE = '¿En qué puedo ayudarte hoy? Di uno para Certificado de Alumno Regular, dos para Ver Horario, o cero para hablar con un asesor inteligente que te derivará al área correcta.';

export default function MainMenu({ onSelectOption, isListening, transcript, modoAccesible, isProcessingVoice, inputMode, menuVideoEnded, userData }) {
    const isVoice = inputMode === 'VOICE';

    // Clases adaptativas para modo Normal (Glassmorphism 32" Totem) vs Accesible (Alto Contraste)
    const cardClass = modoAccesible 
        ? "bg-white border-4 border-gray-300 text-[#111111] hover:bg-gray-100" 
        : "bg-white/10 backdrop-blur-xl border-2 border-white/20 text-white hover:bg-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.2)]";
        
    const textTitleClass = modoAccesible ? "text-[#111111]" : "text-white";
    const badgeClass = modoAccesible ? "bg-gray-200 text-[#111111] border-gray-300" : "bg-white/20 text-white border-white/20 shadow-inner";

    return (
        <div className={`flex flex-col items-center w-full ${isVoice ? 'max-w-[1200px] mt-2' : 'max-w-5xl'}`}>
            
            {/* Título sólo para Touch/Accesible (en Voz se usa el App subtitle) */}
            {!isVoice && (
                <>
                    <div className="text-white mb-6 drop-shadow-sm"><ClipboardList size={56} /></div>
                    {userData?.nombre ? (
                        <h2 className="text-4xl md:text-[3.5rem] font-black text-white text-center mb-12 drop-shadow-lg leading-tight">
                            ¡Hola {userData.nombre}!<br />
                            <span className="text-[2.5rem] opacity-90">¿En qué puedo ayudarte hoy?</span>
                        </h2>
                    ) : (
                        <h2 className="text-4xl md:text-[3.5rem] font-black text-white text-center mb-12 drop-shadow-lg">¿En qué puedo ayudarte hoy?</h2>
                    )}
                </>
            )}

            {/* Píldora de Voz integrada limpiamente sobre los botones (Voice Only) */}
            {isVoice && (
                <div className="w-full flex justify-center mb-10 min-h-[90px]">
                    {isProcessingVoice ? (
                        <div className="flex items-center gap-5 bg-[#FFFFFF] px-10 py-5 rounded-full border border-gray-300 text-[#111111] font-bold text-[28px] shadow-2xl">
                            <Loader size={36} className="animate-spin text-duoc-yellow" />
                            <span>Procesando solicitud...</span>
                        </div>
                    ) : (menuVideoEnded && isListening) ? (
                        <div className="flex items-center justify-center gap-6 bg-white px-10 py-5 rounded-full text-[#111111] font-black text-[28px] shadow-2xl w-max border-4 border-duoc-yellow-light">
                            <div className="flex items-end gap-2 h-8">
                                <span className="w-3 bg-duoc-yellow rounded-full animate-[voiceBar_1s_ease-in-out_infinite] h-[40%]" />
                                <span className="w-3 bg-duoc-yellow rounded-full animate-[voiceBar_1.2s_ease-in-out_infinite_0.1s] h-[80%]" />
                                <span className="w-3 bg-duoc-yellow rounded-full animate-[voiceBar_0.9s_ease-in-out_infinite_0.2s] h-[60%]" />
                                <span className="w-3 bg-duoc-yellow rounded-full animate-[voiceBar_1.1s_ease-in-out_infinite_0.3s] h-[100%]" />
                                <span className="w-3 bg-duoc-yellow rounded-full animate-[voiceBar_1s_ease-in-out_infinite_0.4s] h-[50%]" />
                            </div>
                            <span className="tracking-wide">Escuchando... di tu opción</span>
                        </div>
                    ) : !menuVideoEnded ? (
                        <p className="text-white/60 text-[1.8rem] font-bold tracking-widest uppercase animate-pulse flex items-center justify-center h-full">TanIA está hablando...</p>
                    ) : null}
                </div>
            )}

            {/* Tarjetas grandes de Trámites (Unificadas para Voz y Touch) */}
            {/* Tarjetas grandes de Trámites (Unificadas para Voz y Touch) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-6xl mx-auto mb-10 relative z-10 px-12">
                {TRAMITES.map((tramite) => (
                    <button
                        key={tramite.id}
                        className={`group flex flex-col items-start gap-4 p-8 rounded-[2.5rem] transition-all min-h-[170px] focus:outline-none focus:ring-4 focus:ring-duoc-yellow ${cardClass}`}
                        onClick={() => onSelectOption(tramite.id)}
                    >
                        <div className="flex items-center gap-6 w-full">
                            <span className={`shrink-0 flex items-center justify-center w-[80px] h-[80px] rounded-2xl font-black text-[36px] border-[2px] ${badgeClass}`}>{tramite.id}</span>
                            <span className={`text-[32px] font-black leading-tight break-words text-left ${textTitleClass}`}>{tramite.nombre}</span>
                        </div>
                        <span className={`text-[1.3rem] opacity-90 mt-3 line-clamp-2 text-left w-full font-medium ${textTitleClass}`}>{tramite.descripcion}</span>
                    </button>
                ))}
            </div>

            {/* Botón Asesor */}
            <div className="w-full max-w-6xl mx-auto px-12 pb-8">
                <button 
                    className={`w-full relative z-10 flex items-center justify-center gap-6 px-10 py-8 rounded-[3rem] font-black text-[36px] transition-colors min-h-[140px] focus:outline-none focus:ring-4 focus:ring-duoc-yellow ${cardClass}`} 
                    onClick={() => onSelectOption(0)}
                >
                    <Users size={48} className={textTitleClass} /> 
                    <span className={textTitleClass}>Hablar con un asesor {isVoice ? '(0)' : ''}</span>
                </button>
            </div>
        </div>
    );
}
