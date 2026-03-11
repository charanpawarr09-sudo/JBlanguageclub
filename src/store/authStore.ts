import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AuthState {
    isAuthenticated: boolean;
    token: string | null;
    username: string | null;
    role: string | null;
    login: (token: string, username?: string, role?: string) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            isAuthenticated: false,
            token: null as string | null,
            username: null as string | null,
            role: null as string | null,
            login: (token: string, username?: string, role?: string) =>
                set({ isAuthenticated: true, token, username: username || null, role: role || 'super_admin' }),
            logout: () => set({ isAuthenticated: false, token: null, username: null, role: null }),
        }),
        {
            name: 'voxera-admin-auth',
            storage: createJSONStorage(() => sessionStorage),
        }
    )
);
