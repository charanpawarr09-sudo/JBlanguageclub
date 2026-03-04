import { motion, useScroll, useSpring } from 'motion/react';

/**
 * Mobile-only scroll progress bar at the top of the page.
 * Thin gradient line showing how far user has scrolled.
 */
export default function ScrollProgress() {
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

    return (
        <motion.div
            className="fixed top-0 left-0 right-0 h-[2px] z-[60] origin-left md:hidden"
            style={{
                scaleX,
                background: 'linear-gradient(90deg, #14b8a6, #f59e0b)',
            }}
        />
    );
}
