import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar, Mic, BookOpen, Trophy, Search, PenTool, LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface TimelineItem {
    id?: number;
    day_label: string;
    day_color?: string;
    time: string;
    title: string;
    description?: string;
    icon?: string;
    event_link?: string;
}

interface DayGroup {
    day: string;
    date: string;
    color: string;
    events: { time: string; title: string; icon: LucideIcon; desc: string; slug?: string }[];
}

/* Icon name → Lucide component mapping */
const iconMap: Record<string, LucideIcon> = {
    Calendar, Mic, BookOpen, Trophy, Search, PenTool,
};

/* Convert title to URL slug */
function toSlug(title: string): string {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const fallbackDays: DayGroup[] = [
    {
        day: 'Day 1', date: 'March 16', color: 'teal',
        events: [
            { time: '10:00 AM', title: 'Opening Ceremony', icon: Calendar, desc: 'Inauguration & welcome' },
            { time: '11:30 AM', title: 'Debate Competition', icon: BookOpen, desc: 'Preliminary rounds', slug: 'debate-competition' },
            { time: '2:00 PM', title: 'Poetry Reciting', icon: PenTool, desc: 'Express your soul', slug: 'poetry-reciting' },
        ],
    },
    {
        day: 'Day 2', date: 'March 17', color: 'amber',
        events: [
            { time: '10:00 AM', title: 'Open Mic', icon: Mic, desc: 'Your stage, your voice', slug: 'open-mic' },
            { time: '1:00 PM', title: 'Treasure Hunt', icon: Search, desc: 'Campus-wide adventure', slug: 'treasure-hunt' },
            { time: '3:30 PM', title: 'Debate Semi-Finals', icon: BookOpen, desc: 'Best minds clash', slug: 'debate-competition' },
        ],
    },
    {
        day: 'Day 3', date: 'March 18', color: 'violet',
        events: [
            { time: '10:00 AM', title: 'Grand Finale', icon: Trophy, desc: 'Finals across all events' },
            { time: '2:00 PM', title: 'Awards Ceremony', icon: Trophy, desc: 'Gifts & surprises' },
            { time: '4:00 PM', title: 'Closing Ceremony', icon: Calendar, desc: 'Until next year!' },
        ],
    },
];

/* Group flat API items into day groups */
function groupByDay(items: TimelineItem[]): DayGroup[] {
    const map = new Map<string, { color: string; events: { time: string; title: string; icon: LucideIcon; desc: string; slug?: string }[] }>();

    for (const item of items) {
        if (!map.has(item.day_label)) {
            map.set(item.day_label, { color: item.day_color || 'teal', events: [] });
        }
        map.get(item.day_label)!.events.push({
            time: item.time,
            title: item.title,
            icon: iconMap[item.icon || 'Calendar'] || Calendar,
            desc: item.description || '',
            slug: item.event_link || undefined,
        });
    }

    const result: DayGroup[] = [];
    let i = 0;
    map.forEach((val, key) => {
        i++;
        result.push({ day: `Day ${i}`, date: key, color: val.color, events: val.events });
    });
    return result;
}

const colorMap: Record<string, { bg: string; border: string; dot: string; text: string; iconBg: string }> = {
    teal: { bg: 'bg-teal-500/[0.06]', border: 'border-teal-500/15', dot: 'bg-teal-400', text: 'text-teal-400', iconBg: 'bg-teal-500/10' },
    amber: { bg: 'bg-amber-500/[0.06]', border: 'border-amber-500/15', dot: 'bg-amber-400', text: 'text-amber-400', iconBg: 'bg-amber-500/10' },
    violet: { bg: 'bg-violet-500/[0.06]', border: 'border-violet-500/15', dot: 'bg-violet-400', text: 'text-violet-400', iconBg: 'bg-violet-500/10' },
};

export default function EventTimeline() {
    const [days, setDays] = useState<DayGroup[]>(fallbackDays);

    useEffect(() => {
        fetch('/api/timeline')
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    setDays(groupByDay(data));
                }
            })
            .catch(() => { /* keep fallback */ });
    }, []);

    return (
        <section className="py-28 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-[#040608] via-[#060a0d] to-[#040608]" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/15 to-transparent" />

            <div className="container mx-auto px-4 relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <motion.span
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-white/50 text-xs font-semibold uppercase tracking-[0.2em] mb-6"
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                    >
                        <Calendar className="w-3 h-3 text-violet-400" /> 3-Day Journey
                    </motion.span>
                    <h2 className="text-4xl md:text-6xl font-bold mb-5 text-white" style={{ fontFamily: 'var(--font-display)' }}>
                        The <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent italic">Timeline</span>
                    </h2>
                </motion.div>

                {/* Mobile: Vertical timeline */}
                <div className="md:hidden space-y-8">
                    {days.map((day, di) => {
                        const c = colorMap[day.color] || colorMap.teal;
                        return (
                            <motion.div
                                key={di}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: di * 0.15 }}
                            >
                                {/* Day header */}
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`w-3 h-3 rounded-full ${c.dot} shadow-lg`} />
                                    <span className={`text-lg font-bold ${c.text}`} style={{ fontFamily: 'var(--font-display)' }}>{day.day}</span>
                                    <span className="text-slate-500 text-sm">{day.date}</span>
                                </div>

                                {/* Events */}
                                <div className="ml-6 border-l border-white/[0.06] pl-5 space-y-3">
                                    {day.events.map((event, ei) => {
                                        const cardContent = (
                                            <div className="flex items-start gap-3">
                                                <div className={`p-2 rounded-lg ${c.iconBg} flex-shrink-0`}>
                                                    <event.icon className={`w-4 h-4 ${c.text}`} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-xs text-slate-500 mb-1">{event.time}</div>
                                                    <div className="text-white font-medium text-sm">{event.title}</div>
                                                    <div className="text-slate-500 text-xs mt-0.5">{event.desc}</div>
                                                </div>
                                                {event.slug && <div className={`text-xs ${c.text} self-center opacity-0 group-hover/card:opacity-100 transition-opacity`}>→</div>}
                                            </div>
                                        );
                                        return (
                                            <motion.div
                                                key={ei}
                                                initial={{ opacity: 0, y: 10 }}
                                                whileInView={{ opacity: 1, y: 0 }}
                                                viewport={{ once: true }}
                                                transition={{ delay: di * 0.15 + ei * 0.08 }}
                                            >
                                                {event.slug ? (
                                                    <Link to={`/events/${event.slug}`} className={`block rounded-xl border ${c.border} ${c.bg} p-4 active:scale-[0.98] transition-all hover:border-white/20 group/card`}>
                                                        {cardContent}
                                                    </Link>
                                                ) : (
                                                    <div className={`rounded-xl border ${c.border} ${c.bg} p-4`}>
                                                        {cardContent}
                                                    </div>
                                                )}
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Desktop: 3-column layout */}
                <div className="hidden md:grid grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {days.map((day, di) => {
                        const c = colorMap[day.color] || colorMap.teal;
                        return (
                            <motion.div
                                key={di}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: di * 0.15 }}
                                className={`rounded-2xl border ${c.border} bg-white/[0.02] p-6`}
                            >
                                {/* Day header */}
                                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/[0.06]">
                                    <div className={`w-3 h-3 rounded-full ${c.dot} shadow-lg`} />
                                    <div>
                                        <div className={`text-lg font-bold ${c.text}`} style={{ fontFamily: 'var(--font-display)' }}>{day.day}</div>
                                        <div className="text-slate-500 text-xs">{day.date}, 2026</div>
                                    </div>
                                </div>

                                {/* Events */}
                                <div className="space-y-3">
                                    {day.events.map((event, ei) => {
                                        const cardContent = (
                                            <div className="flex items-start gap-3">
                                                <div className={`p-2 rounded-lg ${c.iconBg} flex-shrink-0`}>
                                                    <event.icon className={`w-4 h-4 ${c.text}`} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-xs text-slate-500 mb-1">{event.time}</div>
                                                    <div className="text-white font-medium text-sm">{event.title}</div>
                                                    <div className="text-slate-500 text-xs mt-0.5">{event.desc}</div>
                                                </div>
                                                {event.slug && <div className={`text-xs ${c.text} self-center opacity-0 group-hover/card:opacity-100 transition-opacity`}>→</div>}
                                            </div>
                                        );
                                        return (
                                            <motion.div
                                                key={ei}
                                                initial={{ opacity: 0 }}
                                                whileInView={{ opacity: 1 }}
                                                viewport={{ once: true }}
                                                transition={{ delay: di * 0.15 + ei * 0.1 }}
                                            >
                                                {event.slug ? (
                                                    <Link to={`/events/${event.slug}`} className={`block rounded-xl ${c.bg} p-4 hover:scale-[1.02] transition-all duration-200 hover:ring-1 hover:ring-white/10 group/card cursor-pointer`}>
                                                        {cardContent}
                                                    </Link>
                                                ) : (
                                                    <div className={`rounded-xl ${c.bg} p-4`}>
                                                        {cardContent}
                                                    </div>
                                                )}
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
