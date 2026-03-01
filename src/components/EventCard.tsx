import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Calendar, ArrowRight, Users, IndianRupee } from 'lucide-react';
import { VoxeraEvent } from '../data/events';
import { getDisplayFee } from '../constants/fees';

interface EventCardProps {
  event: VoxeraEvent;
  index: number;
  key?: string | number;
}

const cardReveal = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  show: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
  },
} as const;

export default function EventCard({ event, index }: EventCardProps) {
  const isFull = event.slots_total !== null && event.slots_filled >= event.slots_total;

  return (
    <Link to={`/events/${event.id}`} className="block group" aria-label={`View ${event.title}`}>
      <motion.div
        variants={cardReveal}
        className="relative rounded-2xl overflow-hidden transition-all duration-500 hover:scale-[1.03]"
      >
        {/* Animated gradient border */}
        <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-teal-500/20 via-transparent to-amber-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Card body */}
        <div className="relative bg-slate-900/80 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/[0.06] group-hover:border-teal-500/30 transition-all duration-500">

          {/* Registration Closed Overlay */}
          {isFull && (
            <div className="absolute inset-0 z-30 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center">
              <span className="px-5 py-2.5 bg-red-900/80 text-red-200 rounded-xl font-bold text-sm uppercase tracking-wider border border-red-500/30">
                Registration Closed
              </span>
            </div>
          )}

          {/* Image with parallax zoom */}
          <div className="relative h-52 overflow-hidden">
            {/* Gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent z-10" />
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/[0.05] to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <img
              src={event.thumbnail_image || event.image}
              alt={event.title}
              className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out"
              loading="lazy"
            />

            {/* Category badge (top left) */}
            <div className="absolute top-4 left-4 z-20">
              <span className="px-3.5 py-1.5 bg-teal-600/90 backdrop-blur-md text-white text-xs font-bold rounded-full uppercase tracking-wider shadow-lg shadow-teal-500/20 border border-teal-400/20">
                {event.category}
              </span>
            </div>

            {/* Fee badge (top right) */}
            <div className="absolute top-4 right-4 z-20">
              <span className="px-3.5 py-1.5 bg-amber-500/90 backdrop-blur-md text-black text-xs font-bold rounded-full shadow-lg shadow-amber-500/20 flex items-center gap-1 border border-amber-400/30">
                <IndianRupee className="w-3 h-3" />
                {getDisplayFee(event.id).replace('₹', '')}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 pt-5">
            <h3
              className="text-xl font-bold mb-2.5 text-white group-hover:text-teal-300 transition-colors duration-300"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {event.title}
            </h3>
            <p className="text-slate-400 text-sm mb-5 line-clamp-2 leading-relaxed">{event.shortDescription}</p>

            {/* Info chips */}
            <div className="flex flex-wrap items-center gap-2.5 mb-5">
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 text-slate-300 rounded-full text-xs font-medium border border-slate-700/50">
                <Users className="w-3 h-3 text-teal-400" />
                {event.teamSize}
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 text-slate-300 rounded-full text-xs font-medium border border-slate-700/50">
                <Calendar className="w-3 h-3 text-teal-400" />
                {event.date}
              </span>
            </div>

            {/* CTA */}
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-teal-400 font-bold text-sm group-hover:text-teal-300 transition-all">
                View Details
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" />
              </span>

              {/* Decorative dot */}
              <div className="w-2 h-2 rounded-full bg-teal-500/50 group-hover:bg-teal-400 group-hover:shadow-[0_0_8px_rgba(20,120,110,0.6)] transition-all duration-300" />
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
