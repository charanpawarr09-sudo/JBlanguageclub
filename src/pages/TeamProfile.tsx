import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import Layout from '../components/Layout';
import { PageSEO } from '../lib/seo';
import { ROUTES } from '../constants/routes';
import {
    ArrowLeft, Mail, Phone, Instagram, Linkedin, Calendar, Award, Sparkles,
    Quote, BookOpen, Users, Share2, Check, MessageCircle, Zap, Star, ArrowRight
} from 'lucide-react';

interface TeamMember {
    id: number;
    name: string;
    role: string;
    designation?: string;
    photo_url?: string;
    dept_group?: string;
    linkedin_url?: string;
    instagram_url?: string;
    email?: string;
    phone?: string;
    bio?: string;
    join_date?: string;
    contributions?: string;
    skills?: string;
    year_branch?: string;
    motto?: string;
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
                ? allMembers.filter((m: TeamMember) => m.id !== Number(id)).slice(0, 6)
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

    // Build journey timeline from available data
    const journeySteps: { icon: typeof Star; label: string; detail: string; color: string }[] = [];
    if (member.join_date) journeySteps.push({ icon: Calendar, label: 'Joined JBLC', detail: member.join_date, color: 'teal' });
    if (member.dept_group) journeySteps.push({ icon: Users, label: `Joined ${member.dept_group} Department`, detail: 'Active contributor', color: 'violet' });
    if (contributionsList.length > 0) journeySteps.push({ icon: Zap, label: 'First Contribution', detail: contributionsList[0], color: 'amber' });
    if (member.designation) journeySteps.push({ icon: Star, label: 'Current Role', detail: `${member.role} — ${member.designation}`, color: 'pink' });
    else if (member.role) journeySteps.push({ icon: Star, label: 'Current Role', detail: member.role, color: 'pink' });

    return (
        <Layout>
            <PageSEO title={member.name} description={`${member.name} — ${member.role} at JBLC`} />

            {/* ═══ Hero / Profile Header with Animated Background ═══ */}
            <section className="relative pt-32 pb-20 overflow-hidden">
                {/* Animated Background Layers */}
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-[#061515] to-[var(--bg-primary)]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,_rgba(20,184,166,0.08)_0%,_transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_80%,_rgba(197,165,90,0.05)_0%,_transparent_50%)]" />

                {/* Animated floating orbs */}
                <div className="absolute top-20 left-10 w-72 h-72 bg-teal-500/5 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-500/[0.03] rounded-full blur-3xl" />
                <motion.div
                    className="absolute top-40 right-[20%] w-48 h-48 bg-violet-500/[0.04] rounded-full blur-2xl"
                    animate={{ y: [0, 20, 0], x: [0, -10, 0] }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute bottom-20 left-[30%] w-64 h-64 bg-teal-400/[0.03] rounded-full blur-3xl"
                    animate={{ y: [0, -15, 0], scale: [1, 1.1, 1] }}
                    transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
                />

                {/* Animated grid pattern */}
                <div className="absolute inset-0 opacity-[0.02]"
                    style={{
                        backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                        backgroundSize: '60px 60px'
                    }}
                />

                <div className="container mx-auto px-4 relative z-10">
                    {/* Back + Share buttons */}
                    <div className="flex items-center justify-between mb-10">
                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                            <Link to={ROUTES.ABOUT} className="inline-flex items-center gap-2 text-slate-400 hover:text-teal-400 transition-colors group">
                                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Team
                            </Link>
                        </motion.div>
                        <motion.button
                            initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                            onClick={handleShare}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.1] hover:border-teal-500/30 hover:bg-teal-500/[0.05] text-slate-300 hover:text-teal-400 transition-all text-sm"
                        >
                            {copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Share2 className="w-4 h-4" /> Share Profile</>}
                        </motion.button>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-10 lg:gap-12 items-center lg:items-start">
                        {/* Left: Avatar + Contact */}
                        <motion.div
                            className="flex flex-col items-center gap-6 lg:w-80 flex-shrink-0 w-full max-w-sm"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            {/* Avatar with glow ring */}
                            <div className="relative group">
                                <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-teal-500/40 via-emerald-500/20 to-amber-500/30 blur-lg opacity-70 group-hover:opacity-100 transition-opacity duration-500" />
                                <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-teal-500 to-amber-500 p-[2px]">
                                    <div className="w-full h-full rounded-full bg-slate-950" />
                                </div>
                                {member.photo_url ? (
                                    <img
                                        src={member.photo_url}
                                        alt={member.name}
                                        className="relative w-44 h-44 rounded-full object-cover border-2 border-transparent"
                                    />
                                ) : (
                                    <div className="relative w-44 h-44 rounded-full bg-gradient-to-br from-teal-600 to-teal-800 flex items-center justify-center text-white text-5xl font-bold border-2 border-transparent">
                                        {getInitials(member.name)}
                                    </div>
                                )}
                            </div>

                            {/* Role Badge */}
                            <div className="text-center">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-medium">
                                    <Sparkles className="w-3 h-3" /> {member.dept_group || 'JBLC'}
                                </span>
                            </div>

                            {/* Contact Links */}
                            <div className="space-y-3 w-full">
                                {member.email && (
                                    <a href={`mailto:${member.email}`} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-teal-500/30 hover:bg-teal-500/[0.05] transition-all group">
                                        <div className="p-2 rounded-lg bg-teal-500/10"><Mail className="w-4 h-4 text-teal-400" /></div>
                                        <span className="text-slate-300 text-sm truncate group-hover:text-white transition-colors">{member.email}</span>
                                    </a>
                                )}
                                {member.phone && (
                                    <a href={`tel:${member.phone}`} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-teal-500/30 hover:bg-teal-500/[0.05] transition-all group">
                                        <div className="p-2 rounded-lg bg-teal-500/10"><Phone className="w-4 h-4 text-teal-400" /></div>
                                        <span className="text-slate-300 text-sm group-hover:text-white transition-colors">{member.phone}</span>
                                    </a>
                                )}
                                {member.instagram_url && (
                                    <a href={member.instagram_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-pink-500/30 hover:bg-pink-500/[0.05] transition-all group">
                                        <div className="p-2 rounded-lg bg-pink-500/10"><Instagram className="w-4 h-4 text-pink-400" /></div>
                                        <span className="text-slate-300 text-sm group-hover:text-white transition-colors">Instagram</span>
                                    </a>
                                )}
                                {member.linkedin_url && (
                                    <a href={member.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-blue-500/30 hover:bg-blue-500/[0.05] transition-all group">
                                        <div className="p-2 rounded-lg bg-blue-500/10"><Linkedin className="w-4 h-4 text-blue-400" /></div>
                                        <span className="text-slate-300 text-sm group-hover:text-white transition-colors">LinkedIn</span>
                                    </a>
                                )}
                            </div>
                        </motion.div>

                        {/* Right: Name, Bio, Details */}
                        <motion.div
                            className="flex-1 min-w-0"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15, duration: 0.6 }}
                        >
                            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-2 text-center lg:text-left" style={{ fontFamily: 'var(--font-display)' }}>
                                {member.name}
                            </h1>
                            <p className="text-lg sm:text-xl text-teal-400 font-medium mb-1 text-center lg:text-left">{member.role}</p>
                            {member.designation && <p className="text-slate-500 text-sm mb-6 text-center lg:text-left">{member.designation}</p>}

                            {/* Motto Quote */}
                            {member.motto && (
                                <motion.div
                                    className="relative p-5 rounded-2xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.08] mb-8"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <Quote className="w-6 h-6 text-amber-500/50 mb-2" />
                                    <p className="text-slate-300 italic text-lg leading-relaxed">"{member.motto}"</p>
                                </motion.div>
                            )}

                            {/* ═══ Quick Stats Bar ═══ */}
                            <motion.div
                                className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.35 }}
                            >
                                {member.join_date && (
                                    <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-teal-500/20 transition-colors">
                                        <Calendar className="w-5 h-5 text-teal-400 flex-shrink-0" />
                                        <div>
                                            <div className="text-xs text-slate-500 uppercase tracking-wider">Joined</div>
                                            <div className="text-white font-medium text-sm">{member.join_date}</div>
                                        </div>
                                    </div>
                                )}
                                {member.year_branch && (
                                    <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-amber-500/20 transition-colors">
                                        <BookOpen className="w-5 h-5 text-amber-400 flex-shrink-0" />
                                        <div>
                                            <div className="text-xs text-slate-500 uppercase tracking-wider">Branch</div>
                                            <div className="text-white font-medium text-sm">{member.year_branch}</div>
                                        </div>
                                    </div>
                                )}
                                {member.dept_group && (
                                    <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-violet-500/20 transition-colors">
                                        <Users className="w-5 h-5 text-violet-400 flex-shrink-0" />
                                        <div>
                                            <div className="text-xs text-slate-500 uppercase tracking-wider">Dept</div>
                                            <div className="text-white font-medium text-sm">{member.dept_group}</div>
                                        </div>
                                    </div>
                                )}
                                {monthsSince > 0 && (
                                    <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-pink-500/20 transition-colors">
                                        <Zap className="w-5 h-5 text-pink-400 flex-shrink-0" />
                                        <div>
                                            <div className="text-xs text-slate-500 uppercase tracking-wider">Active</div>
                                            <div className="text-white font-medium text-sm">{monthsSince} months</div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>

                            {/* Bio */}
                            {member.bio && (
                                <motion.div
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="mb-8"
                                >
                                    <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                        <div className="w-1 h-5 rounded-full bg-gradient-to-b from-teal-400 to-teal-600" />
                                        About
                                    </h2>
                                    <p className="text-slate-400 leading-relaxed whitespace-pre-line">{member.bio}</p>
                                </motion.div>
                            )}

                            {/* Skills */}
                            {skillsList.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                    className="mb-8"
                                >
                                    <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                        <div className="w-1 h-5 rounded-full bg-gradient-to-b from-amber-400 to-amber-600" />
                                        Skills & Interests
                                    </h2>
                                    <div className="flex flex-wrap gap-2">
                                        {skillsList.map((skill, i) => (
                                            <motion.span
                                                key={skill}
                                                className="px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-300 text-sm hover:border-teal-500/30 hover:text-teal-300 transition-all cursor-default"
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: 0.5 + i * 0.05 }}
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
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.6 }}
                                    className="mb-8"
                                >
                                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                        <div className="w-1 h-5 rounded-full bg-gradient-to-b from-violet-400 to-violet-600" />
                                        Contributions at JBLC
                                    </h2>
                                    <div className="space-y-3">
                                        {contributionsList.map((item, i) => (
                                            <motion.div
                                                key={i}
                                                className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-violet-500/20 transition-colors"
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.6 + i * 0.08 }}
                                            >
                                                <Award className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
                                                <span className="text-slate-300 text-sm">{item}</span>
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ═══ JBLC Journey Timeline ═══ */}
            {journeySteps.length > 1 && (
                <section className="py-16 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-primary)] via-[#081818] to-[var(--bg-primary)]" />
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-500/20 to-transparent" />

                    <div className="container mx-auto px-4 relative z-10">
                        <motion.h2
                            className="text-2xl md:text-3xl font-bold text-white mb-10 flex items-center gap-3"
                            style={{ fontFamily: 'var(--font-display)' }}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-teal-400 to-amber-500" />
                            JBLC Journey
                        </motion.h2>

                        <div className="relative max-w-3xl mx-auto">
                            {/* Vertical line */}
                            <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-teal-500/30 via-violet-500/30 to-amber-500/30" />

                            <div className="space-y-6">
                                {journeySteps.map((step, i) => {
                                    const colorMap: Record<string, string> = {
                                        teal: 'border-teal-500/30 bg-teal-500/10 text-teal-400',
                                        violet: 'border-violet-500/30 bg-violet-500/10 text-violet-400',
                                        amber: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
                                        pink: 'border-pink-500/30 bg-pink-500/10 text-pink-400',
                                    };
                                    const dotColor: Record<string, string> = {
                                        teal: 'bg-teal-500 shadow-teal-500/50',
                                        violet: 'bg-violet-500 shadow-violet-500/50',
                                        amber: 'bg-amber-500 shadow-amber-500/50',
                                        pink: 'bg-pink-500 shadow-pink-500/50',
                                    };
                                    return (
                                        <motion.div
                                            key={i}
                                            className="flex items-start gap-6 pl-0"
                                            initial={{ opacity: 0, x: -20 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: i * 0.12 }}
                                        >
                                            {/* Timeline dot */}
                                            <div className="relative flex-shrink-0 w-12 flex justify-center">
                                                <div className={`w-3 h-3 rounded-full ${dotColor[step.color] || dotColor.teal} shadow-lg`} />
                                            </div>

                                            {/* Content card */}
                                            <div className="flex-1 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-colors">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${colorMap[step.color] || colorMap.teal}`}>
                                                        <step.icon className="w-3 h-3" />
                                                        {step.label}
                                                    </span>
                                                </div>
                                                <p className="text-slate-300 text-sm">{step.detail}</p>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* ═══ Contact CTA Card ═══ */}
            {(member.email || member.phone || member.instagram_url || member.linkedin_url) && (
                <section className="py-16 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[var(--bg-primary)]" />
                    {contributionsList.length > 0 && (
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
                    )}

                    <div className="container mx-auto px-4 relative z-10">
                        <motion.div
                            className="max-w-2xl mx-auto p-8 rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.03] to-white/[0.01] text-center"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500/20 to-emerald-500/10 border border-teal-500/20 mb-5">
                                <MessageCircle className="w-6 h-6 text-teal-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                                Get in Touch with {member.name.split(' ')[0]}
                            </h3>
                            <p className="text-slate-400 mb-6 max-w-md mx-auto">
                                Want to connect, collaborate, or just say hello? Reach out through any of these channels!
                            </p>
                            <div className="flex flex-wrap gap-3 justify-center">
                                {member.email && (
                                    <a href={`mailto:${member.email}`} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 hover:bg-teal-500/20 hover:border-teal-500/40 transition-all text-sm font-medium">
                                        <Mail className="w-4 h-4" /> Email
                                    </a>
                                )}
                                {member.phone && (
                                    <a href={`tel:${member.phone}`} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/40 transition-all text-sm font-medium">
                                        <Phone className="w-4 h-4" /> Call
                                    </a>
                                )}
                                {member.instagram_url && (
                                    <a href={member.instagram_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 hover:bg-pink-500/20 hover:border-pink-500/40 transition-all text-sm font-medium">
                                        <Instagram className="w-4 h-4" /> Instagram
                                    </a>
                                )}
                                {member.linkedin_url && (
                                    <a href={member.linkedin_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 hover:border-blue-500/40 transition-all text-sm font-medium">
                                        <Linkedin className="w-4 h-4" /> LinkedIn
                                    </a>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </section>
            )}

            {/* ═══ Other Team Members Carousel ═══ */}
            {otherMembers.length > 0 && (
                <section className="py-16 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-primary)] via-[#081818] to-[var(--bg-primary)]" />
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-500/20 to-transparent" />

                    <div className="container mx-auto px-4 relative z-10">
                        <motion.div
                            className="flex items-center justify-between mb-10"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3" style={{ fontFamily: 'var(--font-display)' }}>
                                <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-amber-400 to-teal-500" />
                                Meet Other Members
                            </h2>
                            <Link to={ROUTES.ABOUT} className="text-sm text-teal-400 hover:text-teal-300 transition-colors inline-flex items-center gap-1">
                                View All <ArrowRight className="w-4 h-4" />
                            </Link>
                        </motion.div>

                        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                            {otherMembers.map((m, i) => (
                                <Link to={`/about/team/${m.id}`} key={m.id}>
                                    <motion.div
                                        className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm p-5 text-center hover:border-teal-500/30 hover:bg-teal-500/[0.04] transition-all duration-300 hover:scale-[1.03] cursor-pointer"
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.06 }}
                                    >
                                        <div className="relative mx-auto mb-3">
                                            <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-teal-500/30 to-amber-500/30 opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-300" />
                                            {m.photo_url ? (
                                                <img src={m.photo_url} alt={m.name} className="relative w-16 h-16 rounded-full object-cover border-2 border-teal-500/20 mx-auto" />
                                            ) : (
                                                <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-teal-600 to-teal-800 flex items-center justify-center text-white text-lg font-bold mx-auto border-2 border-teal-500/20">
                                                    {getInitials(m.name)}
                                                </div>
                                            )}
                                        </div>
                                        <h3 className="text-white font-semibold text-sm mb-0.5 truncate">{m.name}</h3>
                                        <p className="text-teal-400 text-xs font-medium truncate">{m.role}</p>
                                        <span className="inline-block mt-2 text-xs text-slate-500 group-hover:text-teal-400 transition-colors">View →</span>
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
