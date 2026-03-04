import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { PageSEO } from '../lib/seo';
import { ROUTES } from '../constants/routes';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
    return (
        <Layout>
            <PageSEO title="404 — Page Not Found" />

            <div className="min-h-[80vh] flex items-center justify-center px-4 bg-[var(--bg-primary)]">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                >
                    <h1
                        className="text-[10rem] md:text-[14rem] font-bold leading-none gradient-title opacity-80"
                        style={{ fontFamily: 'var(--font-display)' }}
                    >
                        404
                    </h1>
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 -mt-4">
                        Looks like you're lost
                    </h2>
                    <p className="text-slate-400 max-w-md mx-auto mb-10">
                        The page you're looking for doesn't exist or has been moved. But don't worry — there's plenty more to explore at VOXERA 2026.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            to={ROUTES.HOME}
                            className="min-h-[48px] px-8 py-3.5 bg-gradient-to-r from-teal-700 to-teal-600 text-white rounded-xl font-semibold hover:from-teal-600 hover:to-emerald-700 transition-all flex items-center gap-2 shadow-lg shadow-teal-900/30"
                            aria-label="Go Back Home"
                        >
                            <Home className="w-4 h-4" /> Go Back Home
                        </Link>
                        <Link
                            to={ROUTES.EVENTS}
                            className="min-h-[48px] px-8 py-3.5 border border-white/20 text-white rounded-xl font-semibold hover:bg-white/5 hover:border-white/30 transition-all flex items-center gap-2"
                            aria-label="Explore Events"
                        >
                            <Search className="w-4 h-4" /> Explore Events
                        </Link>
                    </div>
                </motion.div>
            </div>
        </Layout>
    );
}
