import { useEffect } from 'react';

export default function SessionTimer({ timeRemaining, timerActive, TIMEOUT_SECONDS }) {
    if (!timerActive) return null;

    const percentage = (timeRemaining / TIMEOUT_SECONDS) * 100;
    const isLow = timeRemaining <= 30;
    const isCritical = timeRemaining <= 10;

    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;

    // Define colors based on threshold
    const bgColor = isCritical ? 'bg-red-500/20' : isLow ? 'bg-duoc-yellow/20' : 'bg-black/40';
    const borderColor = isCritical ? 'border-red-500/50' : isLow ? 'border-duoc-yellow/50' : 'border-white/10';
    const barColor = isCritical ? 'bg-red-500' : isLow ? 'bg-duoc-yellow' : 'bg-green-400';
    const textColor = isCritical ? 'text-red-400' : isLow ? 'text-duoc-yellow' : 'text-white/80';

    return (
        <div className={`fixed top-6 right-6 z-50 flex flex-col gap-2 w-64 backdrop-blur-md border ${borderColor} ${bgColor} rounded-2xl p-4 shadow-xl transition-colors duration-500`}>
            <div className="flex justify-between items-center px-1">
                <span className={`font-mono text-xl font-bold tracking-wider ${textColor}`}>
                    ⏱ {minutes}:{seconds.toString().padStart(2, '0')}
                </span>
                {isCritical && <span className="text-red-400 animate-pulse font-bold text-sm">¡Expirando!</span>}
            </div>

            <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden border border-white/5">
                <div
                    className={`h-full rounded-full transition-all duration-1000 ease-linear ${barColor}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}
