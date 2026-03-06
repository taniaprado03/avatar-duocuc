import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

/**
 * VideoAvatar — Canvas chroma key
 *
 * Why canvas instead of mix-blend-mode:
 *   mix-blend-mode: multiply on #000 → every pixel = 0 (black), avatar invisible.
 *   mix-blend-mode: screen on #000 → only works for dark-bg-on-dark-video,
 *   not white-background video.
 *   Canvas pixel processing is the only correct universal solution for
 *   removing a white background from a video over a dark background.
 *
 * Performance optimisations:
 *   - willReadFrequently: true for getImageData
 *   - Only process pixels that exceed the white threshold
 *   - requestAnimationFrame throttled to canvas size
 */
const VideoAvatar = forwardRef(function VideoAvatar({ src, onEnded }, ref) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const rafRef = useRef(null);
    const activeRef = useRef(false);

    useImperativeHandle(ref, () => ({
        replay() {
            const v = videoRef.current;
            if (v) { v.currentTime = 0; v.play().catch(() => { }); }
        }
    }));

    /* ─── Auto-play on src change ─── */
    useEffect(() => {
        const v = videoRef.current;
        if (!v || !src) return;

        // Start muted so the browser never blocks autoplay
        v.muted = true;
        v.load();

        const onPlaying = () => {
            // Unmute once playback has actually started
            v.muted = false;
        };
        v.addEventListener('playing', onPlaying, { once: true });

        v.play().catch(() => { });

        return () => v.removeEventListener('playing', onPlaying);
    }, [src]);

    /* ─── Canvas chroma-key loop ─── */
    useEffect(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        activeRef.current = true;

        function processFrame() {
            if (!activeRef.current) return;

            // Sync canvas size to video once
            const vw = video.videoWidth || 640;
            const vh = video.videoHeight || 480;
            if (canvas.width !== vw || canvas.height !== vh) {
                canvas.width = vw;
                canvas.height = vh;
            }

            if (!video.paused && !video.ended && video.readyState >= 2) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = frame.data;

                const width = canvas.width;
                const height = canvas.height;
                const centerX = width / 2;
                const centerY = height / 2;

                // Smooth Alpha Matting — Kiosk streaming quality
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];

                    const luma = (r * 0.299 + g * 0.587 + b * 0.114);
                    const max = Math.max(r, g, b);
                    const min = Math.min(r, g, b);
                    const diff = max - min; // chroma / saturation indicator

                    // Protect the center (face, teeth, shirt) using a spatial mask
                    const pixelIndex = i / 4;
                    const x = pixelIndex % width;
                    const y = Math.floor(pixelIndex / width);

                    // Normalized distance squared from center (0 = center, 1 = edges, >1 = corners)
                    const dx = (x - centerX) / centerX;
                    const dy = (y - centerY) / centerY;
                    const distSq = dx * dx + dy * dy;

                    // Core body/face zone (approx inner 50% radius)
                    const isCenter = distSq < 0.25;

                    // Skip the background removal entirely if we are in the safe center zone
                    if (isCenter) continue;

                    // VERY strict: only remove near-perfect white/grey background pixels on the outer area.
                    if (luma > 245 && diff < 12) {
                        // Pure neutral white background
                        data[i + 3] = 0;
                    } else if (luma > 200 && diff < 25) {
                        // Edge transition zone — soft feathering
                        const t = (luma - 200) / 45; // 0..1
                        const alpha = Math.round(255 * (1 - t * t)); // quadratic falloff
                        data[i + 3] = alpha;

                        // Blue-cast suppression: reduce blue bleed from background gradient
                        if (b > r && b > g) {
                            const blueExcess = b - Math.max(r, g);
                            data[i + 2] = Math.max(0, b - blueExcess * 0.7);
                        }

                        // Slight darkening to destroy white halos
                        const correction = t * 15;
                        data[i] = Math.max(0, r - correction);
                        data[i + 1] = Math.max(0, g - correction);
                        data[i + 2] = Math.max(0, data[i + 2] - correction);
                    }
                }

                ctx.putImageData(frame, 0, 0);
            }

            rafRef.current = requestAnimationFrame(processFrame);
        }

        function startLoop() {
            if (video.readyState >= 2) {
                processFrame();
            } else {
                video.addEventListener('loadeddata', processFrame, { once: true });
            }
        }

        startLoop();

        return () => {
            activeRef.current = false;
            cancelAnimationFrame(rafRef.current);
        };
    }, [src]);

    return (
        <div className="absolute inset-0 w-full h-full pointer-events-none flex items-center justify-center">
            <video
                ref={videoRef}
                src={src}
                onEnded={onEnded}
                playsInline
                muted={false}
                style={{ display: 'none' }}
            />
            <canvas
                ref={canvasRef}
                className="w-full h-full object-contain drop-shadow-[0_10px_40px_rgba(0,0,0,0.3)]"
            />
        </div>
    );
});

export default VideoAvatar;
