import { motion } from 'motion/react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { HelpCircle } from 'lucide-react';

const faqs = [
    {
        q: 'Who can participate in VOXERA 2026?',
        a: 'VOXERA is open to all college students across Hyderabad and beyond. Whether you\'re from JBIET or another institution, you\'re welcome to register and compete.',
    },
    {
        q: 'How do I register for events?',
        a: 'Click the "Register" button on our website. You\'ll be guided through selecting your events, filling in your details, and completing the payment. You\'ll receive a confirmation email once done.',
    },
    {
        q: 'Can I participate in multiple events?',
        a: 'Absolutely! You can register for as many events as you want, as long as their timings don\'t clash. Check the Schedule page for event timings.',
    },
    {
        q: 'What should I bring on the event day?',
        a: 'Bring your college ID, registration confirmation (email or screenshot), and any props or materials needed for your specific events. We\'ll provide the rest!',
    },
    {
        q: 'Is there a refund policy?',
        a: 'Registration fees are non-refundable. However, if an event is cancelled by the organizers, a full refund will be processed within 7 business days.',
    },
    {
        q: 'Will certificates be provided?',
        a: 'Yes! All participants receive a participation certificate. Winners receive special certificates along with exciting gifts and surprises.',
    },
];

export default function FAQ() {
    return (
        <section className="py-28 relative overflow-hidden">
            <div className="absolute inset-0 bg-[#040608]" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

            <div className="container mx-auto px-4 relative z-10 max-w-3xl">
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
                        <HelpCircle className="w-3 h-3 text-teal-400" /> Got Questions?
                    </motion.span>
                    <h2 className="text-4xl md:text-6xl font-bold mb-5 text-white" style={{ fontFamily: 'var(--font-display)' }}>
                        Frequently <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent italic">Asked</span>
                    </h2>
                </motion.div>

                {/* FAQ Items */}
                <div className="space-y-3">
                    {faqs.map((faq, i) => (
                        <div key={`faq-${i}`}>
                            <FAQItem question={faq.q} answer={faq.a} index={i} />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function FAQItem({ question, answer, index }: { question: string; answer: string; index: number }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.06 }}
            className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm overflow-hidden hover:border-white/10 transition-colors"
        >
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-5 md:p-6 text-left active:scale-[0.995] transition-transform"
                aria-expanded={isOpen}
            >
                <span className="text-white font-medium text-sm md:text-base pr-4" style={{ fontFamily: 'var(--font-heading)' }}>
                    {question}
                </span>
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-white/[0.05] flex items-center justify-center">
                    {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-teal-400" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                    )}
                </span>
            </button>

            <motion.div
                initial={false}
                animate={{
                    height: isOpen ? 'auto' : 0,
                    opacity: isOpen ? 1 : 0,
                }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
            >
                <div className="px-5 pb-5 md:px-6 md:pb-6">
                    <p className="text-slate-400 text-sm leading-relaxed">
                        {answer}
                    </p>
                </div>
            </motion.div>
        </motion.div>
    );
}
