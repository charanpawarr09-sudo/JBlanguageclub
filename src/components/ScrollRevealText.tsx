import { useRef } from 'react';
import { motion, useScroll, useTransform, MotionValue } from 'motion/react';

/**
 * Desktop-only scroll-triggered text reveal.
 * Words light up one-by-one as the user scrolls.
 * On mobile, renders as a simple fade-in paragraph.
 */
interface ScrollRevealTextProps {
    text: string;
    className?: string;
}

export default function ScrollRevealText({ text, className = '' }: ScrollRevealTextProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start 0.85', 'end 0.4'],
    });

    const words = text.split(' ');

    return (
        <div ref={containerRef} className={className}>
            {/* Desktop: word-by-word reveal */}
            <p className="hidden md:block text-2xl lg:text-3xl leading-relaxed font-light max-w-3xl mx-auto text-center" style={{ fontFamily: 'var(--font-accent)' }}>
                {words.map((word, i) => {
                    const start = i / words.length;
                    const end = start + 1 / words.length;
                    return (
                        <span key={i}>
                            <ScrollWord word={word} progress={scrollYProgress} range={[start, end]} />
                        </span>
                    );
                })}
            </p>

            {/* Mobile: simple fade in */}
            <motion.p
                className="md:hidden text-lg leading-relaxed font-light max-w-lg mx-auto text-center text-slate-400"
                style={{ fontFamily: 'var(--font-accent)' }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
            >
                {text}
            </motion.p>
        </div>
    );
}

interface ScrollWordProps {
    word: string;
    progress: MotionValue<number>;
    range: [number, number];
}

function ScrollWord({ word, progress, range }: ScrollWordProps) {
    const opacity = useTransform(progress, range, [0.15, 1]);
    const color = useTransform(progress, range, ['#475569', '#f1f5f9']);

    return (
        <motion.span className="inline-block mr-[0.3em]" style={{ opacity, color }}>
            {word}
        </motion.span>
    );
}
