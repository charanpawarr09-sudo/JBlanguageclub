import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { PageSEO } from '../lib/seo';
import { ROUTES } from '../constants/routes';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, Users, Award, BookOpen, Sparkles, Heart, Trophy, Star, Zap, Gift } from 'lucide-react';

interface TeamMember {
    id: number;
    name: string;
    role: string;
    designation?: string;
    photo_url?: string;
    photo_position?: string;
    dept_group?: string;
    is_founder?: boolean;
}

interface PastEventItem {
    id?: number;
    name: string;
    date: string;
    year: string;
}

const DEFAULT_PAST_EVENTS = [
    { name: 'Wanna Be Tharoor', date: '12 September 2025', year: '2025' },
    { name: "Engineer's Day Debate", date: '17 September 2025', year: '2025' },
    { name: 'Online Poetry Competition', date: '26 October 2025', year: '2025' },
    { name: 'Wanna Be Tharoor', date: '18 November 2025', year: '2025' },
    { name: 'Debate on Dowry vs Alimony', date: '26 November 2025', year: '2025' },
    { name: 'Script to Screen', date: '28 January 2026', year: '2026' },
    { name: 'JBLC Recruitments', date: '6 – 13 February 2026', year: '2026' },
    { name: 'Letter to Your Valentine', date: '14 February 2026', year: '2026' },
];

function getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function About() {
    const [team, setTeam] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState<Record<string, string>>({});

    useEffect(() => {
        Promise.all([
            fetch('/api/team').then(r => r.json()).catch((): never[] => []),
            fetch('/api/settings').then(r => r.json()).catch(() => ({})),
            fetch('/api/past-events').then(r => r.json()).catch((): never[] => []),
        ]).then(([teamData, settingsData, pastEventsData]) => {
            setTeam(teamData || []);
            setSettings(settingsData || {});
            // Use API past events if available, otherwise fall back
            if (Array.isArray(pastEventsData) && pastEventsData.length > 0) {
                setPastEventsFromApi(pastEventsData);
            }
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const [pastEventsFromApi, setPastEventsFromApi] = useState<PastEventItem[]>([]);

    const pastEvents = pastEventsFromApi.length > 0 ? pastEventsFromApi : (() => {
        try {
            const parsed = settings.past_events ? JSON.parse(settings.past_events) : null;
            return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_PAST_EVENTS;
        } catch { return DEFAULT_PAST_EVENTS; }
    })();

    const years = [...new Set<string>(pastEvents.map((e: { year: string }) => e.year))].sort().reverse();

    // Split team into founders and regular members
    const founders = team.filter(m => m.is_founder);
    const regularMembers = team.filter(m => !m.is_founder);

    return (
        <Layout>
            <PageSEO title="About" description="Learn about VOXERA 2026 and JB Language Club at JBIET." />

            {/* ─── Hero Banner ─── */}
            <section className="relative pt-36 pb-24 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-[#061515] to-[var(--bg-primary)]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,_rgba(20,120,110,0.1)_0%,_transparent_60%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_50%,_rgba(197,165,90,0.05)_0%,_transparent_60%)]" />

                <div className="container mx-auto px-4 relative z-10 text-center">
                    <motion.span
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-sm font-medium mb-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Heart className="w-3.5 h-3.5" /> Our Story
                    </motion.span>

                    <motion.h1
                        className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6 text-white"
                        style={{ fontFamily: 'var(--font-display)' }}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.7 }}
                    >
                        About <span className="gradient-text-animated">VOXERA</span>
                    </motion.h1>

                    <motion.p
                        className="text-slate-400 max-w-2xl mx-auto text-lg"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        The Literary Fiesta that celebrates expression, creativity, and the power of voice.
                    </motion.p>
                </div>
            </section>

            {/* ─── Our Story ─── */}
            <section className="py-24 bg-[var(--bg-primary)]">
                <div className="container mx-auto px-4">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7 }}
                        >
                            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-white" style={{ fontFamily: 'var(--font-display)' }}>
                                The Story Behind <span className="gradient-title">VOXERA</span>
                            </h2>
                            <div className="space-y-5 text-slate-400 leading-relaxed">
                                {(settings.about_text || `JB Language Club was founded at JB Institute of Engineering & Technology with a simple mission: to create a space where students could explore the beauty of language, expression, and the performing arts. What started as a small group of literature enthusiasts has grown into one of the most vibrant student organizations on campus.

VOXERA was born from the idea that every student has a voice worth hearing. Whether it's through the structured logic of a debate, the raw emotion of poetry, the creative spark of a startup pitch, or the thrill of a campus-wide treasure hunt — VOXERA is the stage where all forms of expression converge.

VOXERA' 26 marks the exciting debut of a brand-new literary fiesta, created to bring together talent, expression, and innovation on one dynamic platform. Exciting gifts, 6 competitive events, distinguished judges, and an immersive 2-day experience, VOXERA begins its journey with the ambition to redefine Literary Fiesta across Hyderabad.`).split('\n').filter(Boolean).map((para, i) => (
                                    <p key={i}>{para}</p>
                                ))}
                            </div>
                        </motion.div>

                        {/* Stats grid */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7, delay: 0.2 }}
                            className="grid grid-cols-2 gap-4"
                        >
                            {[
                                { icon: Calendar, value: settings.stats_days || '3', label: 'Days', color: 'teal' },
                                { icon: Trophy, value: settings.stats_events || '6', label: 'Events', color: 'amber' },
                                { icon: Gift, value: 'TBA', label: 'Exciting Gifts', color: 'teal' },
                                { icon: Users, value: settings.stats_participants ? `${settings.stats_participants}+` : '200+', label: 'Participants', color: 'amber' },
                            ].map((stat, i) => (
                                <motion.div
                                    key={i}
                                    className={`p-6 rounded-2xl border backdrop-blur-sm transition-all duration-300 hover:scale-[1.03] ${stat.color === 'teal'
                                        ? 'bg-teal-500/[0.04] border-teal-500/10 hover:border-teal-500/30'
                                        : 'bg-amber-500/[0.04] border-amber-500/10 hover:border-amber-500/30'
                                        }`}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.3 + i * 0.1 }}
                                >
                                    <stat.icon className={`w-6 h-6 mb-3 ${stat.color === 'teal' ? 'text-teal-400' : 'text-amber-400'}`} />
                                    <div className="text-3xl font-bold text-white mb-1" style={{ fontFamily: 'var(--font-display)' }}>{stat.value}</div>
                                    <div className="text-slate-400 text-sm">{stat.label}</div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ─── Meet the Team ─── */}
            <section className="py-24 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-primary)] via-[#081818] to-[var(--bg-primary)]" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-500/20 to-transparent" />

                <div className="container mx-auto px-4 relative z-10">
                    <motion.div
                        className="text-center mb-16"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <motion.span
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-sm font-medium mb-6"
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                        >
                            <Users className="w-3.5 h-3.5" /> The Crew
                        </motion.span>
                        <h2 className="text-3xl md:text-5xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                            Meet Our <span className="gradient-title">Team</span>
                        </h2>
                    </motion.div>

                    {loading ? (
                        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="rounded-2xl border border-slate-800/50 p-6 text-center">
                                    <div className="w-20 h-20 mx-auto rounded-full skeleton mb-4" />
                                    <div className="h-5 skeleton w-2/3 mx-auto mb-2" />
                                    <div className="h-4 skeleton w-1/2 mx-auto" />
                                </div>
                            ))}
                        </div>
                    ) : team.length > 0 ? (
                        <>
                            {/* ═══ Founder / Lead — Cinematic Spotlight ═══ */}
                            {founders.length > 0 && (
                                <div className="mb-20">
                                    {founders.map((member, i) => (
                                        <Link to={`/about/team/${member.id}`} key={member.id} className="block group">
                                            <motion.div
                                                className="relative py-16 sm:py-24 -mx-4 px-4 overflow-hidden cursor-pointer"
                                                initial={{ opacity: 0 }}
                                                whileInView={{ opacity: 1 }}
                                                viewport={{ once: true }}
                                                transition={{ duration: 1, delay: i * 0.2 }}
                                            >
                                                {/* Animated background */}
                                                <div className="absolute inset-0">
                                                    <motion.div
                                                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full blur-[150px] opacity-30"
                                                        style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.2) 0%, rgba(245,158,11,0.08) 50%, transparent 70%)' }}
                                                        animate={{ scale: [1, 1.15, 1], rotate: [0, 5, 0] }}
                                                        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                                                    />
                                                    <motion.div
                                                        className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-amber-500/[0.04] blur-[100px]"
                                                        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
                                                        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
                                                    />
                                                </div>

                                                <div className="relative z-10 text-center max-w-2xl mx-auto">
                                                    {/* Founder badge */}
                                                    <motion.div
                                                        className="mb-10"
                                                        initial={{ opacity: 0, y: 20 }}
                                                        whileInView={{ opacity: 1, y: 0 }}
                                                        viewport={{ once: true }}
                                                        transition={{ delay: 0.2 }}
                                                    >
                                                        <motion.span
                                                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold uppercase tracking-[0.15em]"
                                                            style={{
                                                                background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(20,184,166,0.12))',
                                                                border: '1px solid rgba(245,158,11,0.3)',
                                                                color: '#fbbf24',
                                                            }}
                                                            animate={{
                                                                boxShadow: [
                                                                    '0 0 20px rgba(245,158,11,0), 0 0 40px rgba(245,158,11,0)',
                                                                    '0 0 20px rgba(245,158,11,0.15), 0 0 60px rgba(245,158,11,0.05)',
                                                                    '0 0 20px rgba(245,158,11,0), 0 0 40px rgba(245,158,11,0)',
                                                                ]
                                                            }}
                                                            transition={{ duration: 4, repeat: Infinity }}
                                                        >
                                                            <Star className="w-4 h-4" /> Founder & Lead
                                                        </motion.span>
                                                    </motion.div>

                                                    {/* Large avatar with premium ring */}
                                                    <motion.div
                                                        className="relative inline-block mb-10"
                                                        initial={{ opacity: 0, scale: 0.8 }}
                                                        whileInView={{ opacity: 1, scale: 1 }}
                                                        viewport={{ once: true }}
                                                        transition={{ delay: 0.3, type: 'spring', bounce: 0.3 }}
                                                    >
                                                        {/* Outer glow */}
                                                        <div className="absolute -inset-6 rounded-full bg-gradient-to-br from-teal-500/25 via-amber-500/15 to-violet-500/20 blur-3xl group-hover:blur-2xl transition-all duration-700" />

                                                        {/* Gradient ring */}
                                                        <motion.div
                                                            className="absolute -inset-1.5 rounded-full"
                                                            style={{ background: 'conic-gradient(from 0deg, #14b8a6, #f59e0b, #8b5cf6, #ec4899, #14b8a6)' }}
                                                            animate={{ rotate: [0, 360] }}
                                                            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                                                        >
                                                            <div className="absolute inset-[2px] rounded-full bg-[#071515]" />
                                                        </motion.div>

                                                        {member.photo_url ? (
                                                            <img
                                                                src={member.photo_url}
                                                                alt={member.name}
                                                                className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-full object-cover group-hover:scale-105 transition-transform duration-700"
                                                                style={{ objectPosition: `center ${member.photo_position || 'center'}` }}
                                                            />
                                                        ) : (
                                                            <div className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-800 flex items-center justify-center text-white text-5xl sm:text-6xl font-bold group-hover:scale-105 transition-transform duration-700">
                                                                {getInitials(member.name)}
                                                            </div>
                                                        )}
                                                    </motion.div>

                                                    {/* Name */}
                                                    <motion.h3
                                                        className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-3 tracking-tight"
                                                        style={{ fontFamily: 'var(--font-display)', lineHeight: '1.1' }}
                                                        initial={{ opacity: 0, y: 25 }}
                                                        whileInView={{ opacity: 1, y: 0 }}
                                                        viewport={{ once: true }}
                                                        transition={{ delay: 0.4 }}
                                                    >
                                                        {member.name}
                                                    </motion.h3>

                                                    {/* Role */}
                                                    <motion.p
                                                        className="text-xl sm:text-2xl font-medium mb-2"
                                                        style={{ color: '#5eead4' }}
                                                        initial={{ opacity: 0 }}
                                                        whileInView={{ opacity: 1 }}
                                                        viewport={{ once: true }}
                                                        transition={{ delay: 0.5 }}
                                                    >
                                                        {member.role}
                                                    </motion.p>

                                                    {member.designation && (
                                                        <motion.p
                                                            className="text-slate-500 mb-6"
                                                            initial={{ opacity: 0 }}
                                                            whileInView={{ opacity: 1 }}
                                                            viewport={{ once: true }}
                                                            transition={{ delay: 0.55 }}
                                                        >
                                                            {member.designation}
                                                        </motion.p>
                                                    )}

                                                    {member.dept_group && (
                                                        <motion.span
                                                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/[0.08] border border-teal-500/15 text-teal-400 text-sm font-medium mb-8"
                                                            initial={{ opacity: 0 }}
                                                            whileInView={{ opacity: 1 }}
                                                            viewport={{ once: true }}
                                                            transition={{ delay: 0.6 }}
                                                        >
                                                            <Sparkles className="w-3.5 h-3.5" /> {member.dept_group}
                                                        </motion.span>
                                                    )}

                                                    {/* CTA Button */}
                                                    <motion.div
                                                        className="mt-8"
                                                        initial={{ opacity: 0, y: 15 }}
                                                        whileInView={{ opacity: 1, y: 0 }}
                                                        viewport={{ once: true }}
                                                        transition={{ delay: 0.7 }}
                                                    >
                                                        <span className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl text-sm font-semibold text-white transition-all duration-500 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-teal-500/20"
                                                            style={{
                                                                background: 'linear-gradient(135deg, rgba(20,184,166,0.2), rgba(245,158,11,0.15))',
                                                                border: '1px solid rgba(20,184,166,0.25)',
                                                            }}
                                                        >
                                                            View Full Profile
                                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                                        </span>
                                                    </motion.div>
                                                </div>
                                            </motion.div>
                                        </Link>
                                    ))}
                                </div>
                            )}

                            {/* ═══ Regular Team Members ═══ */}
                            {regularMembers.length > 0 && (
                                <>
                                    {founders.length > 0 && (
                                        <div className="flex items-center gap-4 mb-8 mt-4">
                                            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
                                            <span className="text-slate-500 text-xs uppercase tracking-[0.2em] font-medium">Core Team</span>
                                            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
                                        </div>
                                    )}
                                    <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                        {regularMembers.map((member, i) => (
                                            <Link to={`/about/team/${member.id}`} key={member.id}>
                                                <motion.div
                                                    className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm p-6 text-center hover:border-teal-500/30 hover:bg-teal-500/[0.04] transition-all duration-300 hover:scale-[1.03] cursor-pointer"
                                                    initial={{ opacity: 0, y: 20 }}
                                                    whileInView={{ opacity: 1, y: 0 }}
                                                    viewport={{ once: true }}
                                                    transition={{ delay: i * 0.06 }}
                                                >
                                                    {/* Avatar */}
                                                    <div className="relative mx-auto mb-4">
                                                        <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-teal-500/30 to-amber-500/30 opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-300" />
                                                        {member.photo_url ? (
                                                            <img
                                                                src={member.photo_url}
                                                                alt={member.name}
                                                                className="relative w-20 h-20 rounded-full object-cover border-2 border-teal-500/20 mx-auto"
                                                                style={{ objectPosition: `center ${member.photo_position || 'center'}` }}
                                                            />
                                                        ) : (
                                                            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-teal-600 to-teal-800 flex items-center justify-center text-white text-xl font-bold mx-auto border-2 border-teal-500/20">
                                                                {getInitials(member.name)}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <h3 className="text-white font-semibold text-lg mb-1">{member.name}</h3>
                                                    <p className="text-teal-400 text-sm font-medium">{member.role}</p>
                                                    {member.designation && <p className="text-slate-500 text-xs mt-1">{member.designation}</p>}
                                                    <span className="inline-block mt-3 text-xs text-slate-500 group-hover:text-teal-400 transition-colors">View Profile →</span>
                                                </motion.div>
                                            </Link>
                                        ))}
                                    </div>
                                </>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-16">
                            <Sparkles className="w-12 h-12 text-teal-600 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-white mb-2">Team Coming Soon</h3>
                            <p className="text-slate-400">Our amazing team will be revealed shortly.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* ─── Past Events Timeline ─── */}
            <section className="py-24 bg-[var(--bg-primary)] relative">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
                <div className="container mx-auto px-4">
                    <motion.div
                        className="text-center mb-16"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <motion.span
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium mb-6"
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                        >
                            <Star className="w-3.5 h-3.5" /> Our Journey
                        </motion.span>
                        <h2 className="text-3xl md:text-5xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                            Past <span className="gradient-title">Events</span>
                        </h2>
                    </motion.div>

                    <div className="max-w-3xl mx-auto space-y-12">
                        {years.map(year => (
                            <motion.div
                                key={year}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                            >
                                <div className="flex items-center gap-4 mb-6">
                                    <span className="text-2xl font-bold text-teal-400" style={{ fontFamily: 'var(--font-display)' }}>{year}</span>
                                    <div className="flex-1 h-px bg-gradient-to-r from-teal-500/30 to-transparent" />
                                </div>

                                <div className="grid gap-3 pl-4">
                                    {pastEvents.filter((e: PastEventItem) => e.year === year).map((event: PastEventItem, i: number) => {
                                        const cardContent = (
                                            <>
                                                {/* Timeline dot */}
                                                <div className="w-2 h-2 rounded-full bg-teal-500/50 group-hover:bg-teal-400 group-hover:shadow-[0_0_8px_rgba(20,120,110,0.5)] transition-all flex-shrink-0" />
                                                <div className="flex-1 flex items-center justify-between">
                                                    <span className="text-white font-medium">{event.name}</span>
                                                    <span className="text-slate-500 text-sm flex items-center gap-1.5">
                                                        <Calendar className="w-3 h-3" />
                                                        {event.date}
                                                    </span>
                                                </div>
                                                {event.id && <span className="text-xs text-slate-600 group-hover:text-teal-400 transition-colors">→</span>}
                                            </>
                                        );
                                        return (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, x: -10 }}
                                                whileInView={{ opacity: 1, x: 0 }}
                                                viewport={{ once: true }}
                                                transition={{ delay: i * 0.06 }}
                                            >
                                                {event.id ? (
                                                    <Link
                                                        to={`/about/past-events/${event.id}`}
                                                        className="group flex items-center gap-4 p-4 rounded-xl border border-white/[0.04] bg-white/[0.02] hover:border-amber-500/20 hover:bg-amber-500/[0.03] transition-all duration-300"
                                                    >
                                                        {cardContent}
                                                    </Link>
                                                ) : (
                                                    <div className="group flex items-center gap-4 p-4 rounded-xl border border-white/[0.04] bg-white/[0.02] hover:border-teal-500/20 hover:bg-teal-500/[0.03] transition-all duration-300">
                                                        {cardContent}
                                                    </div>
                                                )}
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── CTA Section ─── */}
            <section className="py-28 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-primary)] to-slate-950" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(20,120,110,0.08)_0%,_transparent_60%)]" />

                <div className="container mx-auto px-4 relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white" style={{ fontFamily: 'var(--font-display)' }}>
                            Ready to Be Part of <span className="gradient-text-animated">VOXERA?</span>
                        </h2>
                        <p className="text-slate-400 max-w-lg mx-auto mb-10 text-lg">
                            Join us for three unforgettable days of creativity, competition, and celebration.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                to={ROUTES.REGISTER}
                                className="group relative inline-flex items-center gap-2 min-h-[52px] px-10 py-4 bg-gradient-to-r from-teal-600 to-teal-500 text-white rounded-2xl font-semibold hover:from-teal-500 hover:to-emerald-600 transition-all shadow-xl shadow-teal-900/30 overflow-hidden"
                                aria-label="Register Now"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-teal-400/0 via-white/10 to-teal-400/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                                <span className="relative">Register Now</span>
                                <ArrowRight className="w-5 h-5 relative group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link
                                to={ROUTES.EVENTS}
                                className="inline-flex items-center gap-2 min-h-[52px] px-10 py-4 border border-white/15 text-white rounded-2xl font-semibold hover:bg-white/5 hover:border-teal-500/30 transition-all"
                                aria-label="View Events"
                            >
                                Explore Events
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>
        </Layout>
    );
}
