import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { ROUTES } from '../constants/routes';

/**
 * Mobile-only floating register button.
 * Appears after scrolling past the hero section CTA.
 * Hidden on desktop via CSS media query check.
 */
export default function FloatingRegisterBtn() {
    const [visible, setVisible] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (!isMobile) return;
        const handleScroll = () => setVisible(window.scrollY > 600);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [isMobile]);

    if (!isMobile) return null;

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="fixed bottom-6 left-4 right-4 z-50 md:hidden"
                >
                    <Link
                        to={ROUTES.REGISTER}
                        className="flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-teal-600 to-teal-500 text-white rounded-2xl font-semibold text-base shadow-2xl shadow-teal-950/60 active:scale-[0.97] transition-transform"
                        aria-label="Register Now"
                    >
                        Register Now
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
