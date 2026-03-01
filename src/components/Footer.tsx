import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react';
import { ROUTES } from '../constants/routes';

const quickLinks = [
  { name: 'Home', path: ROUTES.HOME },
  { name: 'Events', path: ROUTES.EVENTS },
  { name: 'Schedule', path: ROUTES.SCHEDULE },
  { name: 'About', path: ROUTES.ABOUT },
  { name: 'Contact', path: ROUTES.CONTACT },
];

export default function Footer() {
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(s => setSettings(s || {})).catch(() => { });
  }, []);

  const email1 = settings.contact_email || 'voxera2026@gmail.com';
  const email2 = settings.contact_email_2 || 'jblanguageclub@jbiet.edu.in';
  const phone = settings.contact_phone || '';
  const address1 = settings.contact_address_line1 || 'JB Institute of Engineering & Technology';
  const address2 = settings.contact_address_line2 || 'Yenkapally, Moinabad, Hyderabad';
  const instagramUrl = settings.instagram_url || '#';
  const emailUrl = `mailto:${settings.contact_email || 'voxera2026@gmail.com'}`;
  const linkedinUrl = settings.linkedin_url || '#';

  const socialLinks = [
    { icon: Instagram, label: 'Instagram', href: instagramUrl },
    { icon: Mail, label: 'Email', href: emailUrl },
    { icon: Linkedin, label: 'LinkedIn', href: linkedinUrl },
  ];

  return (
    <footer className="bg-[var(--bg-primary)] border-t border-[var(--border-default)] pt-16 pb-8 relative overflow-hidden">
      {/* VOXERA Watermark */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
        aria-hidden="true"
      >
        <span
          className="text-[12rem] md:text-[20rem] font-black text-white/[0.02] tracking-[-0.04em] leading-none"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          VOXERA
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Column 1: Logo + Tagline + Social */}
          <div>
            <Link to="/" className="flex items-center gap-3 mb-4" aria-label="VOXERA Home">
              <img src="/jblc-logo-clean.png" alt="JB Language Club" className="h-12 w-12 object-contain" />
              <div className="flex flex-col">
                <span className="font-bold text-lg tracking-wide text-white" style={{ fontFamily: 'var(--font-heading)' }}>JB Language Club</span>
                <span className="text-[10px] font-semibold tracking-[0.25em] uppercase bg-gradient-to-r from-teal-400 to-teal-400 bg-clip-text text-transparent">Literary Fiesta</span>
              </div>
            </Link>
            <p className="text-slate-400 mb-6 max-w-sm">
              Where voices rise, ideas collide, and creativity knows no bounds. The ultimate Literary Fiesta.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="p-2.5 bg-slate-900 rounded-lg text-slate-400 hover:bg-teal-900/40 hover:text-teal-400 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center border border-slate-800 hover:border-teal-500/30"
                  aria-label={social.label}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-6 text-sm uppercase tracking-wider">Quick Links</h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-slate-400 hover:text-teal-400 transition-colors text-sm"
                    aria-label={link.name}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Contact Info (from API settings) */}
          <div>
            <h3 className="text-white font-semibold mb-6 text-sm uppercase tracking-wider">Contact</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3 text-sm">
                <Mail className="w-4 h-4 text-teal-400 mt-0.5 flex-shrink-0" />
                <div className="text-slate-400">
                  <p>{email1}</p>
                  {email2 && <p>{email2}</p>}
                </div>
              </div>
              {phone && (
                <div className="flex items-start gap-3 text-sm">
                  <Phone className="w-4 h-4 text-teal-400 mt-0.5 flex-shrink-0" />
                  <div className="text-slate-400">
                    <p>{phone}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3 text-sm">
                <MapPin className="w-4 h-4 text-teal-400 mt-0.5 flex-shrink-0" />
                <div className="text-slate-400">
                  <p>{address1}</p>
                  <p>{address2}</p>
                </div>
              </div>
              <p className="text-teal-400 text-sm font-medium pt-2">
                Organized by JB Language Club
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[var(--border-default)] pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-sm">
            © 2026 VOXERA. All rights reserved.
          </p>
          <p className="text-slate-500 text-sm">
            Powered by JB Language Club Tech Team
          </p>
        </div>
      </div>
    </footer>
  );
}
