import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Volume2, Type, AlignLeft, PauseCircle,
    ImageOff, ScanText, Sun, Eye, Layers, X, CheckCircle2, RefreshCw
} from 'lucide-react';

export default function AccessibilityMenu({ onComplete, currentSettings, onSettingChange }) {
    const [activeProfile, setActiveProfile] = useState(null);

    const profiles = [
        { id: 'motor', label: 'Discapacidad Motora', icon: <Layers size={24} /> },
        { id: 'blind', label: 'Ceguera', icon: <Volume2 size={24} /> },
        { id: 'colorblind', label: 'Daltonismo', icon: <Eye size={24} /> },
        { id: 'dyslexia', label: 'Dislexia', icon: <ScanText size={24} /> },
        { id: 'lowvision', label: 'Visión baja', icon: <Sun size={24} /> },
        { id: 'cognitive', label: 'Cognitivo', icon: <Type size={24} /> }
    ];

    const adjustments = [
        { id: 'screenReader', label: 'Leer página', icon: <Volume2 size={32} /> },
        { id: 'highContrast', label: 'Contraste +', icon: <Sun size={32} /> },
        { id: 'largeText', label: 'Agrandar texto', icon: <Type size={32} /> },
        { id: 'textSpacing', label: 'Espaciado', icon: <AlignLeft size={32} /> },
        { id: 'stopAnimations', label: 'Sin animaciones', icon: <PauseCircle size={32} /> },
        { id: 'hideImages', label: 'Ocultar imágenes', icon: <ImageOff size={32} /> },
        { id: 'dyslexiaFont', label: 'Apto para dislexia', icon: <ScanText size={32} /> }
    ];

    const toggleSetting = (id) => {
        onSettingChange(id, !currentSettings[id]);
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-4xl bg-[#F0F2F5] rounded-3xl overflow-hidden shadow-2xl flex flex-col"
            style={{ maxHeight: '90vh' }}
        >
            {/* Header Yellow */}
            <div className="bg-duoc-yellow p-6 flex items-center justify-between">
                <h1 className="text-2xl font-black text-black tracking-tight uppercase">
                    Menú De Accesibilidad
                </h1>
                <button
                    onClick={onComplete}
                    className="p-3 bg-black/10 hover:bg-black/20 rounded-full transition-colors focus:outline-none focus:ring-4 focus:ring-black/50"
                    aria-label="Cerrar y continuar"
                >
                    <X size={28} className="text-black" />
                </button>
            </div>

            <div className="p-8 overflow-y-auto flex-1 text-black">
                {/* Profiles Section */}
                <section className="mb-10">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b-2 border-gray-200">
                        Perfiles de accesibilidad
                    </h2>
                    <div className="grid grid-cols-2 gap-3">
                        {profiles.map(p => (
                            <button
                                key={p.id}
                                onClick={() => setActiveProfile(activeProfile === p.id ? null : p.id)}
                                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all font-semibold ${activeProfile === p.id
                                    ? 'border-duoc-blue bg-duoc-blue/5 text-duoc-blue'
                                    : 'border-white bg-white hover:border-gray-300 text-gray-700'
                                    } shadow-sm focus:outline-none focus:ring-4 focus:ring-duoc-blue/30`}
                            >
                                <span className={`p-2 rounded-lg ${activeProfile === p.id ? 'bg-duoc-blue text-white' : 'bg-gray-100 text-gray-500'}`}>
                                    {p.icon}
                                </span>
                                {p.label}
                                {activeProfile === p.id && <CheckCircle2 size={20} className="ml-auto text-duoc-blue" />}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Individual Tools Section */}
                <section>
                    <h2 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b-2 border-gray-200">
                        Ajustes manuales
                    </h2>
                    <div className="grid grid-cols-3 gap-4">
                        {adjustments.map(adj => {
                            const isActive = currentSettings[adj.id];
                            return (
                                <button
                                    key={adj.id}
                                    onClick={() => toggleSetting(adj.id)}
                                    className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all shadow-sm ${isActive
                                        ? 'border-duoc-blue bg-duoc-blue/5 text-duoc-blue'
                                        : 'border-white bg-white hover:border-gray-300 text-gray-700'
                                        } focus:outline-none focus:ring-4 focus:ring-duoc-blue/30`}
                                    aria-pressed={isActive}
                                >
                                    <div className={isActive ? 'text-duoc-blue' : 'text-gray-800'}>
                                        {adj.icon}
                                    </div>
                                    <span className="font-bold text-base text-center leading-tight">
                                        {adj.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </section>
            </div>

            {/* Footer Reset & Finish Buttons */}
            <div className="p-6 bg-white border-t border-gray-200 flex flex-col gap-3 justify-center">
                <button
                    onClick={() => {
                        setActiveProfile(null);
                        Object.keys(currentSettings).forEach(key => onSettingChange(key, false));
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-duoc-yellow to-duoc-yellow-dark text-black font-bold text-lg py-4 rounded-xl shadow-md transition-transform hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-duoc-yellow/50"
                >
                    <RefreshCw size={24} />
                    Restablecer todas las configuraciones de accesibilidad
                </button>
                <button
                    onClick={onComplete}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold text-xl py-5 rounded-xl shadow-lg transition-transform hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-green-500/50"
                >
                    <CheckCircle2 size={28} />
                    Guardar y Continuar al Menú
                </button>
            </div>
        </motion.div>
    );
}
