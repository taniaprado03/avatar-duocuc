import { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react';

const VideoAvatar = forwardRef(function VideoAvatar({ src, onEnded, onPlayError }, ref) {
    const videoRef1 = useRef(null);
    const videoRef2 = useRef(null);

    // Toggle state deciding which video element is currently active
    const [activeVideo, setActiveVideo] = useState(1);

    // Track previous and current sources for crossfading
    const [src1, setSrc1] = useState(src);
    const [src2, setSrc2] = useState('');

    useImperativeHandle(ref, () => ({
        replay() {
            const activeRef = activeVideo === 1 ? videoRef1.current : videoRef2.current;
            if (activeRef) {
                activeRef.currentTime = 0;
                activeRef.play().catch(() => { });
            }
        }
    }));

    // Synchronize current src prop to active element
    useEffect(() => {
        if (src === src1 && activeVideo === 1) return;
        if (src === src2 && activeVideo === 2) return;

        if (activeVideo === 1) {
            setSrc2(src);
            setActiveVideo(2);
        } else {
            setSrc1(src);
            setActiveVideo(1);
        }
    }, [src]);

    // Handle play/pause logic after render finishes and DOM reflects new src
    useEffect(() => {
        if (activeVideo === 1) {
            if (videoRef1.current) {
                videoRef1.current.muted = true;
                videoRef1.current.load();
                const p = videoRef1.current.play();
                if (p !== undefined) p.then(() => { videoRef1.current.muted = false; }).catch(err => { if (err.name === 'NotAllowedError' && onPlayError) onPlayError(); });
            }
            if (videoRef2.current) {
                const prev = videoRef2.current;
                setTimeout(() => {
                    prev.pause();
                    prev.muted = true;
                    prev.currentTime = 0;
                }, 500);
            }
        } else {
            if (videoRef2.current) {
                videoRef2.current.muted = true;
                videoRef2.current.load();
                const p = videoRef2.current.play();
                if (p !== undefined) p.then(() => { videoRef2.current.muted = false; }).catch(err => { if (err.name === 'NotAllowedError' && onPlayError) onPlayError(); });
            }
            if (videoRef1.current) {
                const prev = videoRef1.current;
                setTimeout(() => {
                    prev.pause();
                    prev.muted = true;
                    prev.currentTime = 0;
                }, 500);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeVideo]);

    const handleEnded = (elementNum) => {
        if (activeVideo === elementNum && onEnded) onEnded();
    }

    return (
        <div className="w-full h-full relative bg-transparent">
            {/* Video Element 1 */}
            <video
                ref={videoRef1}
                src={src1}
                onEnded={() => handleEnded(1)}
                playsInline
                className={`absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-500 ease-in-out ${activeVideo === 1 ? 'opacity-100 z-10' : 'opacity-0 z-0'
                    }`}
            />
            {/* Video Element 2 */}
            <video
                ref={videoRef2}
                src={src2}
                onEnded={() => handleEnded(2)}
                playsInline
                className={`absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-500 ease-in-out ${activeVideo === 2 ? 'opacity-100 z-10' : 'opacity-0 z-0'
                    }`}
            />
        </div>
    );
});

export default VideoAvatar;
