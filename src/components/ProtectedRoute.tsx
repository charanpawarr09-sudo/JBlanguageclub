import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ROUTES } from '../constants/routes';
import { ReactNode, useEffect, useState } from 'react';

interface ProtectedRouteProps {
    children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { isAuthenticated, logout } = useAuthStore();
    const [checking, setChecking] = useState(true);
    const [valid, setValid] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            setChecking(false);
            setValid(false);
            return;
        }

        // Verify JWT cookie is still valid on mount / refresh
        fetch('/api/auth/me', { credentials: 'include' })
            .then((res) => {
                if (res.ok) {
                    setValid(true);
                } else {
                    // Token expired or invalid — clear auth state
                    logout();
                    setValid(false);
                }
            })
            .catch(() => {
                logout();
                setValid(false);
            })
            .finally(() => setChecking(false));
    }, [isAuthenticated, logout]);

    if (checking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!valid) {
        return <Navigate to={ROUTES.ADMIN_LOGIN} replace />;
    }

    return <>{children}</>;
}
