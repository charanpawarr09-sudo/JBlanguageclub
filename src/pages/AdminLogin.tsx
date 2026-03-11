import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuthStore } from '../store/authStore';
import { ROUTES } from '../constants/routes';
import Logo from '../components/Logo';
import { Lock, Loader2, AlertCircle } from 'lucide-react';

export default function AdminLogin() {
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                if (res.status === 429) {
                    setError(`Too many attempts. Try again in ${data.retryAfter || 'a few'} minutes.`);
                } else {
                    setError(data.error || 'Invalid credentials');
                }
                return;
            }

            login(data.token || 'authenticated', data.username, data.role);
            navigate(ROUTES.ADMIN);
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] px-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-[var(--bg-secondary)] border border-[var(--border-default)] p-8 rounded-2xl shadow-2xl"
            >
                {/* Logo */}
                <div className="flex flex-col items-center mb-8">
                    <Logo className="h-16 w-16 mb-4" />
                    <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                        VOXERA Admin
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Sign in to manage the platform</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="admin"
                            required
                            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all min-h-[48px]"
                            aria-label="Username"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all min-h-[48px]"
                            aria-label="Password"
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-900/20 border border-red-900/50 rounded-lg flex items-center gap-3 text-red-400 text-sm">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full min-h-[48px] py-3.5 bg-gradient-to-r from-teal-700 to-teal-600 text-white font-bold rounded-xl hover:from-teal-600 hover:to-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-teal-900/30"
                        aria-label="Sign In"
                    >
                        {loading ? (
                            <><Loader2 className="w-5 h-5 animate-spin" /> Signing in...</>
                        ) : (
                            <><Lock className="w-4 h-4" /> Sign In</>
                        )}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
