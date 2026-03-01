import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ROUTES } from '../constants/routes';

const navLinks = [
  { name: 'Home', path: ROUTES.HOME },
  { name: 'Events', path: ROUTES.EVENTS },
  { name: 'Schedule', path: ROUTES.SCHEDULE },
  { name: 'About', path: ROUTES.ABOUT },
  { name: 'Contact', path: ROUTES.CONTACT },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled
          ? 'bg-slate-950/80 backdrop-blur-xl shadow-lg shadow-black/20'
          : 'bg-transparent'
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link to="/" className="flex items-center gap-3.5 group" aria-label="VOXERA Home">
                <div className="relative">
                  {/* Outer glow pulse */}
                  <div className="absolute -inset-1.5 bg-gradient-to-r from-teal-600 to-emerald-700 rounded-full opacity-0 group-hover:opacity-60 blur-md transition-all duration-500 animate-pulse" />
                  <img src="/jblc-logo-clean.png" alt="JB Language Club" className="relative h-12 w-12 object-contain transition-transform duration-300 group-hover:scale-105" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-[17px] tracking-wide text-white leading-none group-hover:text-teal-200 transition-colors duration-300" style={{ fontFamily: 'var(--font-heading)' }}>
                    JB Language Club
                  </span>
                  <span className="text-[10px] font-semibold tracking-[0.25em] uppercase mt-1 bg-gradient-to-r from-teal-400 to-teal-400 bg-clip-text text-transparent">
                    Belong,Express,Become
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop Links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`relative px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-300 min-h-[40px] flex items-center ${location.pathname === link.path
                    ? 'text-white'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  aria-label={link.name}
                >
                  <span className="relative z-10">{link.name}</span>
                  {location.pathname === link.path && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute inset-0 bg-white/5 rounded-full z-0 border border-white/5"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </Link>
              ))}
              <Link
                to={ROUTES.REGISTER}
                className="ml-2 px-5 py-2.5 bg-gradient-to-r from-teal-700 to-teal-600 text-white rounded-full text-sm font-semibold hover:from-teal-600 hover:to-emerald-700 transition-all min-h-[40px] flex items-center shadow-md shadow-teal-900/30"
                aria-label="Register"
              >
                Register
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 focus:outline-none transition-colors min-h-[48px] min-w-[48px]"
                aria-label={isOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isOpen}
              >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Full-Screen Overlay — OUTSIDE nav to avoid backdrop-filter containing block issue */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 top-16 bg-slate-950/98 backdrop-blur-2xl z-50 overflow-y-auto"
          >
            <div className="flex flex-col items-center justify-start h-full px-8 pt-8 pb-20 space-y-2">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="w-full max-w-sm"
                >
                  <Link
                    to={link.path}
                    onClick={() => setIsOpen(false)}
                    className={`block px-6 py-4 rounded-2xl text-center text-lg font-medium transition-all min-h-[56px] ${location.pathname === link.path
                      ? 'text-white bg-teal-600/20 border border-teal-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                      }`}
                    aria-label={link.name}
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: navLinks.length * 0.07 }}
                className="w-full max-w-sm pt-4"
              >
                <Link
                  to={ROUTES.REGISTER}
                  onClick={() => setIsOpen(false)}
                  className="block w-full px-6 py-4 bg-gradient-to-r from-teal-700 to-teal-600 text-white rounded-2xl text-center text-lg font-semibold hover:from-teal-600 hover:to-emerald-700 transition-all min-h-[56px] shadow-lg shadow-teal-900/30"
                  aria-label="Register"
                >
                  Register Now
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
