import { motion } from 'framer-motion';
import { Type, Sun, PauseCircle, ScanText, Maximize2, RefreshCw, CheckCircle2 } from 'lucide-react';

const OPTIONS = [
    {
        id: 'largeText',
        label: 'Agrandar texto',
        description: 'Aumenta el tamaño de toda la tipografía',
        icon: <Type size={36} />,
    },
    {
        id: 'highContrast',
        label: 'Alto contraste',
        description: 'Fondo oscuro con texto de máximo contraste',
        icon: <Sun size={36} />,
    },
    {
        id: 'stopAnimations',
        label: 'Sin animaciones',
        description: 'Elimina transiciones y efectos visuales',
        icon: <PauseCircle size={36} />,
    },
    {
        id: 'dyslexiaFont',
        label: 'Fuente dislexia',
        description: 'Fuente especial para facilitar la lectura',
        icon: <ScanText size={36} />,
    },
    {
        id: 'bigButtons',
        label: 'Botones grandes',
        description: 'Aumenta el tamaño de todos los botones',
        icon: <Maximize2 size={36} />,
    },
];

export default function AccessibilityMenu({ onComplete, currentSettings, onSettingChange }) {

    const toggleSetting = (id) => {
        onSettingChange(id, !currentSettings[id]);
    };

    const resetAll = () => {
        OPTIONS.forEach(opt => onSettingChange(opt.id, false));
    };

    const activeCount = OPTIONS.filter(o => currentSettings[o.id]).length;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-3xl bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col"
            style={{ maxHeight: '92vh' }}
        >
            {/* Header */}
            <div className="bg-duoc-yellow px-8 py-6 flex items-center justify-between">
                <div>
                    <h1 className="text-[26px] font-black text-[#111111] tracking-tight">
                        Accesibilidad
                    </h1>
                    <p className="text-[15px] font-medium text-[#333333] mt-1">
                        Personaliza tu experiencia en el tótem
                    </p>
                </div>
                {activeCount > 0 && (
                    <span className="flex items-center justify-center w-10 h-10 rounded-full bg-[#111111] text-white font-black text-[18px]">
                        {activeCount}
                    </span>
                )}
            </div>

            {/* Options Grid */}
            <div className="p-6 overflow-y-auto flex-1">
                <div className="flex flex-col gap-3">
                    {OPTIONS.map(opt => {
                        const isActive = !!currentSettings[opt.id];
                        return (
                            <button
                                key={opt.id}
                                onClick={() => toggleSetting(opt.id)}
                                aria-pressed={isActive}
                                className={`flex items-center gap-5 px-6 py-5 rounded-xl border-2 transition-all text-left min-h-[80px] ${
                                    isActive
                                        ? 'border-[#111111] bg-gray-100'
                                        : 'border-gray-200 bg-white hover:border-gray-300'
                                }`}
                            >
                                <div className={`shrink-0 flex items-center justify-center w-14 h-14 rounded-xl ${
                                    isActive ? 'bg-[#111111] text-white' : 'bg-gray-200 text-[#000000]'
                                }`}>
                                    {opt.icon}
                                </div>
                                <div className="flex-1">
                                    <p className={`font-black text-[20px] leading-tight text-[#111111]`}>
                                        {opt.label}
                                    </p>
                                    <p className="text-[15px] text-gray-700 mt-1 font-semibold">
                                        {opt.description}
                                    </p>
                                </div>
                                {isActive && (
                                    <CheckCircle2 size={28} className="shrink-0 text-duoc-blue" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 pt-4 bg-white border-t border-gray-100 flex flex-col gap-3">
                {activeCount > 0 && (
                    <button
                        onClick={resetAll}
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl border-2 border-gray-300 bg-white text-[#111111] font-bold text-[18px] hover:bg-gray-50 transition-colors min-h-[56px]"
                    >
                        <RefreshCw size={20} /> Restablecer todo
                    </button>
                )}
                <button
                    onClick={onComplete}
                    className="w-full flex items-center justify-center gap-3 px-6 py-5 rounded-xl bg-[#111111] text-white font-black text-[20px] hover:bg-black transition-colors min-h-[64px] shadow-lg"
                >
                    <CheckCircle2 size={24} />
                    Guardar y continuar
                </button>
            </div>
        </motion.div>
    );
}
