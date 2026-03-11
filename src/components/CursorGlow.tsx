import { useEffect, useRef, useState } from 'react';

/**
 * Desktop-only cursor glow effect.
 * A subtle teal glow follows the mouse cursor.
 * Completely hidden on mobile (no render).
 */
export default function CursorGlow() {
    const glowRef = useRef<HTMLDivElement>(null);
    const [isDesktop, setIsDesktop] = useState(false);

    useEffect(() => {
        const check = () => setIsDesktop(window.innerWidth >= 768 && !('ontouchstart' in window));
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    useEffect(() => {
        if (!isDesktop || !glowRef.current) return;

        let x = 0, y = 0;
        let currentX = 0, currentY = 0;

        const onMove = (e: MouseEvent) => {
            x = e.clientX;
            y = e.clientY;
        };

        let raf: number;
        const animate = () => {
            currentX += (x - currentX) * 0.15;
            currentY += (y - currentY) * 0.15;
            if (glowRef.current) {
                glowRef.current.style.transform = `translate(${currentX - 150}px, ${currentY - 150}px)`;
            }
            raf = requestAnimationFrame(animate);
        };

        window.addEventListener('mousemove', onMove, { passive: true });
        raf = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('mousemove', onMove);
            cancelAnimationFrame(raf);
        };
    }, [isDesktop]);

    if (!isDesktop) return null;

    return (
        <div
            ref={glowRef}
            className="pointer-events-none fixed top-0 left-0 z-[5] w-[300px] h-[300px] rounded-full opacity-[0.04] mix-blend-screen"
            style={{
                background: 'radial-gradient(circle, rgba(20,184,166,0.6) 0%, transparent 70%)',
                willChange: 'transform',
            }}
        />
    );
}
