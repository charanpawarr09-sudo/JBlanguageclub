import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import Layout from '../components/Layout';
import { PageSEO } from '../lib/seo';
import { ROUTES } from '../constants/routes';
import { ArrowLeft, Calendar, Users, Trophy, Star, Camera, Heart, Sparkles } from 'lucide-react';

interface PastEvent {
    id: number;
    name: string;
    date: string;
    year: string;
    description?: string;
    winner_info?: string;
    photos?: string[];
    highlights?: string;
    participants_count?: number;
}

export default function PastEventDetail() {
    const { id } = useParams<{ id: string }>();
    const [event, setEvent] = useState<PastEvent | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

    useEffect(() => {
        fetch(`/api/past-events/${id}`).then(r => r.json())
            .then(data => { setEvent(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <Layout>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
                </div>
            </Layout>
        );
    }

    if (!event) {
        return (
            <Layout>
                <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                    <h1 className="text-2xl font-bold text-white">Event Not Found</h1>
                    <Link to={ROUTES.ABOUT} className="text-teal-400 hover:underline">← Back to About</Link>
                </div>
            </Layout>
        );
    }

    const photos = event.photos && event.photos.length > 0 ? event.photos : [];
    const highlightsList = event.highlights ? event.highlights.split('\n').filter(Boolean) : [];
    const winnerLines = event.winner_info ? event.winner_info.split('\n').filter(Boolean) : [];

    return (
        <Layout>
            <PageSEO title={event.name} description={`${event.name} — A memorable JBLC event from ${event.year}`} />

            {/* ─── Cinematic Hero ─── */}
            <section className="relative pt-28 pb-24 overflow-hidden">
                {/* Multi-layer background */}
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-[#0a0f12] to-[var(--bg-primary)]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_30%,_rgba(245,158,11,0.06)_0%,_transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_70%,_rgba(20,184,166,0.04)_0%,_transparent_50%)]" />

                {/* Floating memory particles */}
                <div className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full bg-amber-400/30 animate-pulse" />
                <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 rounded-full bg-teal-400/20 animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute bottom-1/4 left-1/3 w-1 h-1 rounded-full bg-amber-300/25 animate-pulse" style={{ animationDelay: '2s' }} />

                {/* Warm glow orbs */}
                <div className="absolute top-20 right-20 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-10 w-96 h-96 bg-teal-500/3 rounded-full blur-3xl" />

                <div className="container mx-auto px-4 relative z-10">
                    {/* Back button */}
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                        <Link to={ROUTES.ABOUT} className="inline-flex items-center gap-2 text-slate-400 hover:text-amber-400 transition-colors mb-10 group">
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Past Events
                        </Link>
                    </motion.div>

                    {/* Event Header */}
                    <div className="max-w-4xl">
                        <motion.span
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium mb-6"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <Heart className="w-3.5 h-3.5" /> Memories of {event.year}
                        </motion.span>

                        <motion.h1
                            className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4"
                            style={{ fontFamily: 'var(--font-display)' }}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1, duration: 0.7 }}
                        >
                            {event.name}
                        </motion.h1>

                        <motion.div
                            className="flex flex-wrap items-center gap-4 mb-8"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-slate-300 text-sm">
                                <Calendar className="w-4 h-4 text-amber-400" /> {event.date}
                            </span>
                            {event.participants_count && (
                                <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-slate-300 text-sm">
                                    <Users className="w-4 h-4 text-teal-400" /> {event.participants_count}+ Participants
                                </span>
                            )}
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ─── Content ─── */}
            <section className="pb-24 bg-[var(--bg-primary)]">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto space-y-16">

                        {/* Description */}
                        {event.description && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                            >
                                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3" style={{ fontFamily: 'var(--font-display)' }}>
                                    <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-amber-400 to-amber-600" />
                                    About the Event
                                </h2>
                                <p className="text-slate-400 text-lg leading-relaxed whitespace-pre-line pl-5 border-l border-amber-500/10">
                                    {event.description}
                                </p>
                            </motion.div>
                        )}

                        {/* Photo Gallery */}
                        {photos.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                            >
                                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3" style={{ fontFamily: 'var(--font-display)' }}>
                                    <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-teal-400 to-teal-600" />
                                    <Camera className="w-6 h-6 text-teal-400" />
                                    Gallery
                                </h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {photos.map((photo, i) => (
                                        <motion.div
                                            key={i}
                                            className="relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer group"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            whileInView={{ opacity: 1, scale: 1 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: i * 0.08 }}
                                            onClick={() => setSelectedPhoto(photo)}
                                        >
                                            <img src={photo} alt={`${event.name} photo ${i + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Winners */}
                        {winnerLines.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                            >
                                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3" style={{ fontFamily: 'var(--font-display)' }}>
                                    <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-amber-400 to-yellow-500" />
                                    <Trophy className="w-6 h-6 text-amber-400" />
                                    Winners & Achievements
                                </h2>
                                <div className="space-y-3">
                                    {winnerLines.map((line, i) => (
                                        <motion.div
                                            key={i}
                                            className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-amber-500/[0.04] to-transparent border border-amber-500/10 hover:border-amber-500/25 transition-colors"
                                            initial={{ opacity: 0, x: -15 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: i * 0.1 }}
                                        >
                                            <Star className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                                            <span className="text-slate-300">{line}</span>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Highlights */}
                        {highlightsList.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                            >
                                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3" style={{ fontFamily: 'var(--font-display)' }}>
                                    <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-violet-400 to-violet-600" />
                                    <Sparkles className="w-6 h-6 text-violet-400" />
                                    Highlights
                                </h2>
                                <div className="space-y-3">
                                    {highlightsList.map((item, i) => (
                                        <motion.div
                                            key={i}
                                            className="flex items-start gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-violet-500/20 transition-colors"
                                            initial={{ opacity: 0, x: -10 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: i * 0.08 }}
                                        >
                                            <div className="w-2 h-2 rounded-full bg-violet-400 mt-2 flex-shrink-0" />
                                            <span className="text-slate-300">{item}</span>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </section>

            {/* Lightbox */}
            {selectedPhoto && (
                <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedPhoto(null)}>
                    <motion.img
                        src={selectedPhoto}
                        alt="Gallery photo"
                        className="max-w-full max-h-[90vh] object-contain rounded-2xl"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    />
                    <button className="absolute top-6 right-6 text-white/70 hover:text-white text-2xl" onClick={() => setSelectedPhoto(null)}>✕</button>
                </div>
            )}
        </Layout>
    );
}
