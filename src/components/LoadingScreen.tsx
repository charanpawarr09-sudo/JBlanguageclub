import { motion } from 'motion/react';

export default function LoadingScreen() {
    return (
        <div className="fixed inset-0 z-[100] bg-slate-950 flex items-center justify-center">
            {/* Background orbs */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-teal-600/10 rounded-full blur-3xl float-orb" />
                <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-amber-500/8 rounded-full blur-3xl float-orb float-orb-delay-1" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="relative flex flex-col items-center"
            >
                {/* Logo with glow ring */}
                <div className="relative mb-8">
                    <div className="absolute -inset-4 bg-gradient-to-r from-teal-500 to-emerald-600 rounded-full opacity-20 blur-xl animate-pulse" />
                    <div className="relative p-[3px] rounded-full bg-gradient-to-br from-teal-400 via-emerald-500 to-teal-700 glow-pulse">
                        <img src="/jblc-logo.png" alt="Loading" className="h-20 w-20 rounded-full object-cover bg-slate-950" />
                    </div>
                </div>

                {/* Title */}
                <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-3xl font-bold gradient-text-animated mb-3"
                    style={{ fontFamily: 'var(--font-display)' }}
                >
                    VOXERA
                </motion.h1>

                {/* Loading bar */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden"
                >
                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: '100%' }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                        className="h-full w-1/2 bg-gradient-to-r from-teal-500 to-amber-500 rounded-full"
                    />
                </motion.div>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-slate-500 text-sm mt-4 tracking-wider uppercase"
                >
                    Literary Fiesta
                </motion.p>
            </motion.div>
        </div>
    );
}
