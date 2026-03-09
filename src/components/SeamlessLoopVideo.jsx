import React, { useEffect, useRef, useState } from 'react';

export default function SeamlessLoopVideo({ src, className = "" }) {
    const video1Ref = useRef(null);
    const video2Ref = useRef(null);
    const [activeVideo, setActiveVideo] = useState(1);

    // Fade duration (0.5s) optimized to hide jump cut natively without ghosting
    const CROSSFADE_TIME = 0.5;

    useEffect(() => {
        const v1 = video1Ref.current;
        const v2 = video2Ref.current;
        if (!v1 || !v2) return;

        let animationFrameId;
        let hasSwitched = false;

        const checkTimeLoop = () => {
            const currentVideo = activeVideo === 1 ? v1 : v2;
            const nextVideo = activeVideo === 1 ? v2 : v1;

            if (currentVideo.duration) {
                // When we reach (duration - 0.5s), trigger the fade precisely
                if (currentVideo.currentTime >= currentVideo.duration - CROSSFADE_TIME && !hasSwitched) {
                    hasSwitched = true;
                    nextVideo.currentTime = 0;
                    nextVideo.play().catch(() => { });
                    setActiveVideo(activeVideo === 1 ? 2 : 1);
                }
            }

            animationFrameId = requestAnimationFrame(checkTimeLoop);
        };

        animationFrameId = requestAnimationFrame(checkTimeLoop);

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [activeVideo]);

    return (
        <div className={`relative ${className}`}>
            <video
                ref={video1Ref}
                src={src}
                autoPlay
                muted
                playsInline
                style={{ transition: 'opacity 500ms ease-in-out' }}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity ${activeVideo === 1 ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
            />
            <video
                ref={video2Ref}
                src={src}
                muted
                playsInline
                style={{ transition: 'opacity 500ms ease-in-out' }}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity ${activeVideo === 2 ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
            />
        </div>
    );
}
