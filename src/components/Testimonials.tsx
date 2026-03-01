import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Quote } from 'lucide-react';

interface Testimonial {
    id?: number;
    quote: string;
    name: string;
    college?: string;
    emoji?: string;
}

const fallbackTestimonials: Testimonial[] = [
    {
        quote: "VOXERA was the highlight of my college life. The energy, the people, the competitions — everything was on another level.",
        name: "Priya Sharma",
        college: "JBIET, CSE 2025",
        emoji: "✨",
    },
    {
        quote: "I never thought I'd win a debate competition. VOXERA gave me the confidence to speak up and be heard.",
        name: "Rahul Verma",
        college: "CBIT, ECE 2025",
        emoji: "🏆",
    },
    {
        quote: "The Open Mic night was magical. Poets, singers, comedians — all sharing one stage. Pure goosebumps.",
        name: "Ananya Reddy",
        college: "JBIET, IT 2026",
        emoji: "🎤",
    },
    {
        quote: "From registration to the closing ceremony, everything was so well organized. The website itself impressed us!",
        name: "Karthik Nair",
        college: "VNR VJIET, CSE 2025",
        emoji: "💯",
    },
];

export default function Testimonials() {
    const [testimonials, setTestimonials] = useState<Testimonial[]>(fallbackTestimonials);

    useEffect(() => {
        fetch('/api/testimonials')
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data) && data.length > 0) setTestimonials(data);
            })
            .catch(() => { /* keep fallback */ });
    }, []);

    return (
        <section className="py-28 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-[#040608] via-[#080c10] to-[#040608]" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/15 to-transparent" />

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
                        <Quote className="w-3 h-3 text-amber-400" /> Voices of VOXERA
                    </motion.span>
                    <h2 className="text-4xl md:text-6xl font-bold mb-5 text-white" style={{ fontFamily: 'var(--font-display)' }}>
                        What They <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent italic">Say</span>
                    </h2>
                    <p className="text-slate-500 max-w-lg mx-auto text-base">
                        Hear from the people who lived the VOXERA experience.
                    </p>
                </motion.div>

                {/* Mobile: Horizontal scroll snap */}
                <div className="md:hidden flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 scrollbar-hide">
                    {testimonials.map((t, i) => (
                        <motion.div
                            key={t.id || i}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="flex-shrink-0 w-[85vw] snap-center"
                        >
                            <TestimonialCard {...t} />
                        </motion.div>
                    ))}
                </div>

                {/* Desktop: 2x2 Grid */}
                <div className="hidden md:grid grid-cols-2 gap-6 max-w-5xl mx-auto">
                    {testimonials.map((t, i) => (
                        <motion.div
                            key={t.id || i}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.12 }}
                        >
                            <TestimonialCard {...t} />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function TestimonialCard({ quote, name, college, emoji }: Testimonial) {
    return (
        <div className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-7 hover:border-amber-500/15 transition-all duration-300 h-full">
            {/* Quote mark */}
            <div className="text-amber-500/20 text-5xl leading-none mb-3 select-none" style={{ fontFamily: 'var(--font-display)' }}>"</div>

            <p className="text-slate-300 text-sm leading-relaxed mb-6 italic" style={{ fontFamily: 'var(--font-accent)' }}>
                {quote}
            </p>

            <div className="flex items-center gap-3 mt-auto">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-600 to-emerald-700 flex items-center justify-center text-lg">
                    {emoji || '⭐'}
                </div>
                <div>
                    <div className="text-white font-medium text-sm">{name}</div>
                    <div className="text-slate-500 text-xs">{college}</div>
                </div>
            </div>
        </div>
    );
}
