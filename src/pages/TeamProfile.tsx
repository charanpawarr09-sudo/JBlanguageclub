import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import Layout from '../components/Layout';
import { PageSEO } from '../lib/seo';
import { ROUTES } from '../constants/routes';
import {
    ArrowLeft, Mail, Phone, Instagram, Calendar, Award, Sparkles,
    Quote, BookOpen, Users, Share2, Check, Zap, Star, ArrowRight
} from 'lucide-react';

interface TeamMember {
    id: number;
    name: string;
    role: string;
    designation?: string;
    photo_url?: string;
    photo_position?: string;
    dept_group?: string;
    instagram_url?: string;
    email?: string;
    phone?: string;
    bio?: string;
    join_date?: string;
    contributions?: string;
    skills?: string;
    year_branch?: string;
    motto?: string;
    is_founder?: boolean;
}

function getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getMonthsSince(joinDate: string): number {
    try {
        const parts = joinDate.toLowerCase();
        const months: Record<string, number> = {
            january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
            july: 6, august: 7, september: 8, october: 9, november: 10, december: 11
        };
        for (const [name, idx] of Object.entries(months)) {
            if (parts.includes(name)) {
                const yearMatch = parts.match(/\d{4}/);
                if (yearMatch) {
                    const joinD = new Date(parseInt(yearMatch[0]), idx);
                    const now = new Date();
                    return Math.max(0, (now.getFullYear() - joinD.getFullYear()) * 12 + now.getMonth() - joinD.getMonth());
                }
            }
        }
    } catch { /* fallback */ }
    return 0;
}

export default function TeamProfile() {
    const { id } = useParams<{ id: string }>();
    const [member, setMember] = useState<TeamMember | null>(null);
    const [loading, setLoading] = useState(true);
    const [otherMembers, setOtherMembers] = useState<TeamMember[]>([]);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        Promise.all([
            fetch(`/api/team/${id}`).then(r => r.json()),
            fetch('/api/team').then(r => r.json()),
        ]).then(([memberData, allMembers]) => {
            setMember(memberData);
            const others = Array.isArray(allMembers)
                ? allMembers.filter((m: TeamMember) => m.id !== Number(id)).slice(0, 4)
                : [];
            setOtherMembers(others);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [id]);

    const handleShare = () => {
        const url = window.location.href;
        if (navigator.share) {
            navigator.share({ title: member?.name, url }).catch(() => { });
        } else {
            navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
                </div>
            </Layout>
        );
    }

    if (!member) {
        return (
            <Layout>
                <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                    <h1 className="text-2xl font-bold text-white">Member Not Found</h1>
                    <Link to={ROUTES.ABOUT} className="text-teal-400 hover:underline">← Back to About</Link>
                </div>
            </Layout>
        );
    }

    const skillsList = member.skills ? member.skills.split(',').map(s => s.trim()).filter(Boolean) : [];
    const contributionsList = member.contributions ? member.contributions.split('\n').filter(Boolean) : [];
    const monthsSince = member.join_date ? getMonthsSince(member.join_date) : 0;
    const firstName = member.name.split(' ')[0];

    return (
        <Layout>
            <PageSEO title={member.name} description={`${member.name} — ${member.role} at JB Language Club`} />

            {/* ═══════════════════════════════════════════════════════ */}
            {/* ───  IMMERSIVE HERO SECTION  ─── */}
            {/* ═══════════════════════════════════════════════════════ */}
            <section className="relative min-h-[75vh] flex items-center overflow-hidden">
                {/* Layered background */}
                <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-[#040f0f] to-[#071515]" />

                    {/* Radial gradient accents */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_30%,_rgba(20,184,166,0.12)_0%,_transparent_60%)]" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_70%,_rgba(245,158,11,0.06)_0%,_transparent_55%)]" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(139,92,246,0.04)_0%,_transparent_40%)]" />
                </div>

                <div className="container mx-auto px-4 relative z-10 pt-20 pb-12">
                    {/* Navigation bar */}
                    <div className="flex items-center justify-between mb-6">
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
                            <Link to={ROUTES.ABOUT} className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white/[0.04] border border-white/[0.08] hover:border-teal-500/40 hover:bg-teal-500/[0.06] text-slate-300 hover:text-white transition-all duration-300 text-sm font-medium backdrop-blur-sm">
                                <ArrowLeft className="w-4 h-4" /> Back to Team
                            </Link>
                        </motion.div>
                        <motion.button
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
                            onClick={handleShare}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/[0.04] border border-white/[0.08] hover:border-teal-500/40 hover:bg-teal-500/[0.06] text-slate-300 hover:text-white transition-all duration-300 text-sm font-medium backdrop-blur-sm"
                        >
                            {copied ? <><Check className="w-4 h-4 text-emerald-400" /> Copied!</> : <><Share2 className="w-4 h-4" /> Share</>}
                        </motion.button>
                    </div>

                    {/* Profile card — centered, vertical layout */}
                    <div className="max-w-3xl mx-auto text-center">
                        {/* Founder badge */}
                        {member.is_founder && (
                            <motion.div
                                className="mb-8"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                            >
                                <motion.span
                                    className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold tracking-wide"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(20,184,166,0.15))',
                                        border: '1px solid rgba(245,158,11,0.35)',
                                        color: '#f5a623',
                                    }}
                                    animate={{
                                        boxShadow: [
                                            '0 0 0 0 rgba(245,158,11,0), 0 0 30px rgba(245,158,11,0)',
                                            '0 0 20px 4px rgba(245,158,11,0.1), 0 0 60px rgba(245,158,11,0.05)',
                                            '0 0 0 0 rgba(245,158,11,0), 0 0 30px rgba(245,158,11,0)',
                                        ]
                                    }}
                                    transition={{ duration: 4, repeat: Infinity }}
                                >
                                    <Star className="w-4 h-4" /> FOUNDER & LEAD
                                </motion.span>
                            </motion.div>
                        )}

                        {/* Avatar */}
                        <motion.div
                            className="relative inline-block mb-10"
                            initial={{ opacity: 0, scale: 0.85 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.7, type: 'spring', bounce: 0.3 }}
                        >
                            <div className="absolute -inset-4 rounded-full bg-gradient-to-br from-teal-500/30 via-emerald-500/20 to-amber-500/25 blur-2xl" />
                            {member.photo_url ? (
                                <>
                                    <div className="absolute -inset-[3px] rounded-full" style={{ background: 'linear-gradient(135deg, #14b8a6, #f59e0b, #8b5cf6, #14b8a6)' }} />
                                    <img
                                        src={member.photo_url}
                                        alt={member.name}
                                        className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-full object-cover block"
                                        style={{ objectPosition: `center ${member.photo_position || 'center'}` }}
                                    />
                                </>
                            ) : (
                                <>
                                    <div className="absolute -inset-[3px] rounded-full" style={{ background: 'linear-gradient(135deg, #14b8a6, #f59e0b, #8b5cf6, #14b8a6)' }} />
                                    <div className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-full bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-800 flex items-center justify-center text-white text-6xl font-bold">
                                        {getInitials(member.name)}
                                    </div>
                                </>
                            )}
                        </motion.div>

                        {/* Name — large, display font */}
                        <motion.h1
                            className="text-4xl sm:text-5xl md:text-7xl font-black text-white mb-4 tracking-tight"
                            style={{ fontFamily: 'var(--font-display)', lineHeight: '1.1' }}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15, duration: 0.6 }}
                        >
                            {member.name}
                        </motion.h1>

                        {/* Role */}
                        <motion.p
                            className="text-xl sm:text-2xl font-medium mb-2"
                            style={{ color: '#5eead4' }}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25, duration: 0.5 }}
                        >
                            {member.role}
                        </motion.p>

                        {member.designation && (
                            <motion.p
                                className="text-slate-500 text-base mb-8"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.35 }}
                            >
                                {member.designation}
                            </motion.p>
                        )}

                        {/* Department badge */}
                        {member.dept_group && (
                            <motion.div
                                className="mb-10"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.4 }}
                            >
                                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/[0.08] border border-teal-500/20 text-teal-400 text-sm font-medium">
                                    <Sparkles className="w-3.5 h-3.5" /> {member.dept_group}
                                </span>
                            </motion.div>
                        )}

                        {/* Motto quote — elegant design */}
                        {member.motto && (
                            <motion.div
                                className="max-w-xl mx-auto mb-10"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5, duration: 0.6 }}
                            >
                                <div className="relative p-8 rounded-3xl overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.025), rgba(255,255,255,0.005))' }}>
                                    <div className="absolute inset-0 border border-white/[0.06] rounded-3xl" />
                                    <div className="absolute top-4 left-6">
                                        <Quote className="w-8 h-8 text-teal-500/20" />
                                    </div>
                                    <p className="relative text-slate-300 text-lg sm:text-xl italic leading-relaxed tracking-wide pt-4" style={{ fontFamily: 'Georgia, serif' }}>
                                        "{member.motto}"
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        {/* Quick connect buttons */}
                        <motion.div
                            className="flex flex-wrap gap-3 justify-center"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                        >
                            {member.email && (
                                <a href={`mailto:${member.email}`} className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:border-teal-500/40 hover:bg-teal-500/[0.06] text-slate-300 hover:text-white transition-all duration-300 text-sm font-medium group">
                                    <Mail className="w-4 h-4 text-teal-400 group-hover:scale-110 transition-transform" /> {member.email}
                                </a>
                            )}
                            {member.phone && (
                                <a href={`tel:${member.phone}`} className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:border-emerald-500/40 hover:bg-emerald-500/[0.06] text-slate-300 hover:text-white transition-all duration-300 text-sm font-medium group">
                                    <Phone className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" /> {member.phone}
                                </a>
                            )}
                            {member.instagram_url && (
                                <a href={member.instagram_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:border-pink-500/40 hover:bg-pink-500/[0.06] text-slate-300 hover:text-white transition-all duration-300 text-sm font-medium group">
                                    <Instagram className="w-4 h-4 text-pink-400 group-hover:scale-110 transition-transform" /> Instagram
                                </a>
                            )}
                        </motion.div>
                    </div>
                </div>

                {/* Bottom fade */}
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--bg-primary)] to-transparent" />
            </section>

            {/* ═══════════════════════════════════════════════════════ */}
            {/* ───  STATS + INFO SECTION  ─── */}
            {/* ═══════════════════════════════════════════════════════ */}
            {(member.join_date || member.year_branch || member.dept_group || monthsSince > 0) && (
                <section className="py-20 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[var(--bg-primary)]" />
                    <div className="container mx-auto px-4 relative z-10">
                        <motion.div
                            className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                        >
                            {member.join_date && (
                                <div className="group p-6 rounded-3xl text-center transition-all duration-500 hover:scale-105" style={{ background: 'linear-gradient(135deg, rgba(20,184,166,0.06), rgba(20,184,166,0.02))', border: '1px solid rgba(20,184,166,0.12)' }}>
                                    <Calendar className="w-6 h-6 text-teal-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                                    <div className="text-xs text-slate-500 uppercase tracking-[0.15em] mb-1 font-medium">Joined</div>
                                    <div className="text-white font-bold text-sm">{member.join_date}</div>
                                </div>
                            )}
                            {member.year_branch && (
                                <div className="group p-6 rounded-3xl text-center transition-all duration-500 hover:scale-105" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.06), rgba(245,158,11,0.02))', border: '1px solid rgba(245,158,11,0.12)' }}>
                                    <BookOpen className="w-6 h-6 text-amber-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                                    <div className="text-xs text-slate-500 uppercase tracking-[0.15em] mb-1 font-medium">Branch</div>
                                    <div className="text-white font-bold text-sm">{member.year_branch}</div>
                                </div>
                            )}
                            {member.dept_group && (
                                <div className="group p-6 rounded-3xl text-center transition-all duration-500 hover:scale-105" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.06), rgba(139,92,246,0.02))', border: '1px solid rgba(139,92,246,0.12)' }}>
                                    <Users className="w-6 h-6 text-violet-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                                    <div className="text-xs text-slate-500 uppercase tracking-[0.15em] mb-1 font-medium">Department</div>
                                    <div className="text-white font-bold text-sm">{member.dept_group}</div>
                                </div>
                            )}
                            {monthsSince > 0 && (
                                <div className="group p-6 rounded-3xl text-center transition-all duration-500 hover:scale-105" style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.06), rgba(236,72,153,0.02))', border: '1px solid rgba(236,72,153,0.12)' }}>
                                    <Zap className="w-6 h-6 text-pink-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                                    <div className="text-xs text-slate-500 uppercase tracking-[0.15em] mb-1 font-medium">Active</div>
                                    <div className="text-white font-bold text-sm">{monthsSince} months</div>
                                </div>
                            )}
                        </motion.div>
                    </div>
                </section>
            )}

            {/* ═══════════════════════════════════════════════════════ */}
            {/* ───  ABOUT + SKILLS + CONTRIBUTIONS  ─── */}
            {/* ═══════════════════════════════════════════════════════ */}
            {(member.bio || skillsList.length > 0 || contributionsList.length > 0) && (
                <section className="py-20 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-primary)] via-[#081818] to-[var(--bg-primary)]" />
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-500/15 to-transparent" />

                    <div className="container mx-auto px-4 relative z-10">
                        <div className="max-w-4xl mx-auto space-y-16">
                            {/* Bio */}
                            {member.bio && (
                                <motion.div
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6 }}
                                >
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-teal-400 to-teal-600" />
                                        <h2 className="text-2xl sm:text-3xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                                            About {firstName}
                                        </h2>
                                    </div>
                                    <p className="text-slate-400 text-lg leading-[1.9] whitespace-pre-line pl-5 border-l-2 border-teal-500/10">
                                        {member.bio}
                                    </p>
                                </motion.div>
                            )}

                            {/* Skills */}
                            {skillsList.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6 }}
                                >
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-amber-400 to-amber-600" />
                                        <h2 className="text-2xl sm:text-3xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                                            Skills & Interests
                                        </h2>
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        {skillsList.map((skill, i) => (
                                            <motion.span
                                                key={skill}
                                                className="px-5 py-2.5 rounded-2xl text-sm font-medium cursor-default transition-all duration-300 hover:scale-105"
                                                style={{
                                                    background: `linear-gradient(135deg, rgba(${50 + i * 20}, ${180 - i * 10}, ${170 - i * 15}, 0.08), rgba(${50 + i * 20}, ${180 - i * 10}, ${170 - i * 15}, 0.03))`,
                                                    border: `1px solid rgba(${50 + i * 20}, ${180 - i * 10}, ${170 - i * 15}, 0.15)`,
                                                    color: `rgba(${120 + i * 15}, ${230 - i * 8}, ${220 - i * 10}, 0.9)`,
                                                }}
                                                initial={{ opacity: 0, scale: 0.85 }}
                                                whileInView={{ opacity: 1, scale: 1 }}
                                                viewport={{ once: true }}
                                                transition={{ delay: i * 0.06 }}
                                            >
                                                {skill}
                                            </motion.span>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {/* Contributions */}
                            {contributionsList.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6 }}
                                >
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-violet-400 to-violet-600" />
                                        <h2 className="text-2xl sm:text-3xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                                            Contributions at JBLC
                                        </h2>
                                    </div>
                                    <div className="space-y-4">
                                        {contributionsList.map((item, i) => (
                                            <motion.div
                                                key={i}
                                                className="group flex items-start gap-4 p-5 rounded-2xl transition-all duration-300 hover:scale-[1.01]"
                                                style={{
                                                    background: 'linear-gradient(135deg, rgba(139,92,246,0.04), rgba(139,92,246,0.01))',
                                                    border: '1px solid rgba(139,92,246,0.08)',
                                                }}
                                                initial={{ opacity: 0, x: -20 }}
                                                whileInView={{ opacity: 1, x: 0 }}
                                                viewport={{ once: true }}
                                                transition={{ delay: i * 0.08 }}
                                            >
                                                <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-violet-500/20 transition-colors">
                                                    <Award className="w-4 h-4 text-violet-400" />
                                                </div>
                                                <span className="text-slate-300 text-base leading-relaxed">{item}</span>
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* ═══════════════════════════════════════════════════════ */}
            {/* ───  OTHER TEAM MEMBERS  ─── */}
            {/* ═══════════════════════════════════════════════════════ */}
            {otherMembers.length > 0 && (
                <section className="py-20 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[var(--bg-primary)]" />
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/15 to-transparent" />

                    <div className="container mx-auto px-4 relative z-10">
                        <motion.div
                            className="flex items-center justify-between mb-12 max-w-4xl mx-auto"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-amber-400 to-teal-500" />
                                <h2 className="text-2xl sm:text-3xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                                    Meet the Crew
                                </h2>
                            </div>
                            <Link to={ROUTES.ABOUT} className="text-sm text-teal-400 hover:text-teal-300 transition-colors inline-flex items-center gap-1.5 group">
                                View All <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                        </motion.div>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-4xl mx-auto">
                            {otherMembers.map((m, i) => (
                                <Link to={`/about/team/${m.id}`} key={m.id}>
                                    <motion.div
                                        className="group relative rounded-3xl p-6 text-center transition-all duration-500 hover:scale-[1.04] cursor-pointer"
                                        style={{
                                            background: 'linear-gradient(135deg, rgba(255,255,255,0.025), rgba(255,255,255,0.005))',
                                            border: '1px solid rgba(255,255,255,0.06)',
                                        }}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.08 }}
                                        whileHover={{ borderColor: 'rgba(20,184,166,0.3)' }}
                                    >
                                        <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-teal-500/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                        <div className="relative mx-auto mb-4">
                                            <div className="absolute -inset-1.5 rounded-full bg-gradient-to-br from-teal-500/25 to-amber-500/25 opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-500" />
                                            {m.photo_url ? (
                                                <img src={m.photo_url} alt={m.name} className="relative w-18 h-18 rounded-full object-cover border-2 border-white/[0.08] mx-auto group-hover:border-teal-500/30 transition-colors" style={{ width: 72, height: 72, objectPosition: `center ${m.photo_position || 'center'}` }} />
                                            ) : (
                                                <div className="relative rounded-full bg-gradient-to-br from-teal-600 to-teal-800 flex items-center justify-center text-white text-lg font-bold mx-auto border-2 border-white/[0.08] group-hover:border-teal-500/30 transition-colors" style={{ width: 72, height: 72 }}>
                                                    {getInitials(m.name)}
                                                </div>
                                            )}
                                        </div>
                                        <h3 className="text-white font-semibold text-base mb-1 truncate relative">{m.name}</h3>
                                        <p className="text-teal-400 text-xs font-medium truncate relative">{m.role}</p>
                                        <span className="inline-block mt-3 text-xs text-slate-500 group-hover:text-amber-400 transition-colors relative">View Profile →</span>
                                    </motion.div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </Layout>
    );
}
