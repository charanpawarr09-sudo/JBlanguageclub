import { useState, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays, Users, FileText, BarChart3, Settings,
  LogOut, Menu, X, ChevronRight, Shield, ClipboardList, Quote, Clock, Star
} from 'lucide-react';


// Lazy-load admin modules for code splitting
const EventsManager = lazy(() => import('./admin/EventsManager'));
const TeamManager = lazy(() => import('./admin/TeamManager'));
const RegistrationsManager = lazy(() => import('./admin/RegistrationsManager'));
const ContentEditor = lazy(() => import('./admin/ContentEditor'));
const AnalyticsDashboard = lazy(() => import('./admin/AnalyticsDashboard'));
const SiteSettings = lazy(() => import('./admin/SiteSettings'));
const TestimonialsManager = lazy(() => import('./admin/TestimonialsManager'));
const TimelineManager = lazy(() => import('./admin/TimelineManager'));
const PastEventsManager = lazy(() => import('./admin/PastEventsManager'));

type Tab = 'dashboard' | 'events' | 'team' | 'registrations' | 'content' | 'testimonials' | 'timeline' | 'past-events' | 'settings';

const navItems: { id: Tab; label: string; icon: typeof CalendarDays; roles?: string[] }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'events', label: 'Events', icon: CalendarDays },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'registrations', label: 'Registrations', icon: ClipboardList },
  { id: 'content', label: 'Content', icon: FileText },
  { id: 'testimonials', label: 'Testimonials', icon: Quote },
  { id: 'timeline', label: 'Timeline', icon: Clock },
  { id: 'past-events', label: 'Past Events', icon: Star },
  { id: 'settings', label: 'Settings', icon: Settings, roles: ['super_admin', 'technical_admin'] },
];

export default function Admin() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { username, role, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    logout();
    navigate('/admin/login');
  };

  const visibleNav = navItems.filter(item => !item.roles || item.roles.includes(role || ''));

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <AnalyticsDashboard />;
      case 'events': return <EventsManager />;
      case 'team': return <TeamManager />;
      case 'registrations': return <RegistrationsManager />;
      case 'content': return <ContentEditor />;
      case 'testimonials': return <TestimonialsManager />;
      case 'timeline': return <TimelineManager />;
      case 'past-events': return <PastEventsManager />;
      case 'settings': return <SiteSettings />;
      default: return <AnalyticsDashboard />;
    }
  };

  const roleBadgeColors: Record<string, string> = {
    super_admin: 'bg-red-900/40 text-red-400 border-red-800',
    technical_admin: 'bg-blue-900/40 text-blue-400 border-blue-800',
    event_manager: 'bg-amber-900/40 text-amber-400 border-amber-800',
    content_editor: 'bg-emerald-900/40 text-emerald-400 border-emerald-800',
  };

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Logo area */}
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-teal-600 to-emerald-700 rounded-xl flex items-center justify-center shadow-lg shadow-teal-900/30">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight">VOXERA</h1>
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">Admin Panel</p>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 lg:hidden">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {visibleNav.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button key={item.id} onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
                  ${isActive
                    ? 'bg-gradient-to-r from-teal-600/20 to-emerald-700/10 text-white border border-teal-700/50 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}>
                <item.icon className={`w-[18px] h-[18px] ${isActive ? 'text-teal-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                {item.label}
                {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto text-teal-500" />}
              </button>
            );
          })}
        </nav>

        {/* User card + logout */}
        <div className="p-3 border-t border-slate-800">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-slate-800/40">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-600 to-emerald-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {(username || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{username || 'Admin'}</p>
              <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium border ${roleBadgeColors[role || 'super_admin'] || roleBadgeColors.super_admin}`}>
                {(role || 'admin').replace('_', ' ')}
              </span>
            </div>
            <button onClick={handleLogout} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-red-400 transition-colors flex-shrink-0" title="Logout">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-800 px-4 lg:px-6 py-3 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 lg:hidden">
              <Menu className="w-5 h-5" />
            </button>
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-sm">
              <span className="text-slate-500">Admin</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              <span className="text-white font-medium capitalize">{activeTab === 'dashboard' ? 'Dashboard' : navItems.find(n => n.id === activeTab)?.label}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-900/20 border border-emerald-800 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-400 text-xs font-medium">VOXERA 2026</span>
            </div>
          </div>
        </header>

        {/* Content area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Suspense fallback={
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            </div>
          }>
            {renderContent()}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
