import { create } from 'zustand';
import { User, UserRole } from '../types';
import { useHospitalStore } from './hospitalStore';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  role: UserRole | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  setRole: (role: UserRole) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  role: null,
  login: (email, password) => {
    // Admin login
    if (email === 'admin@apexcare.com' && password === 'admin123') {
      const admin: User = {
        id: 'u1',
        name: 'Admin Apex',
        email: 'admin@apexcare.com',
        role: 'Admin',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop',
      };
      set({ user: admin, role: 'Admin', isAuthenticated: true });
      return true;
    }

    // Doctor login (checking from hospital store)
    const { doctors } = useHospitalStore.getState();
    const doctorInRegistry = doctors.find((d: any) => d.email === email && (d.password === password || password === 'password123'));

    if (doctorInRegistry) {
      const doctor: User = {
        id: doctorInRegistry.id,
        name: doctorInRegistry.name,
        email: doctorInRegistry.email,
        role: 'Doctor',
        avatar: `https://i.pravatar.cc/150?u=${doctorInRegistry.id}`,
      };
      set({ user: doctor, role: 'Doctor', isAuthenticated: true });
      return true;
    }

    if (email.endsWith('@apexcare.com') && password === 'password123') {
      const doctor: User = {
        id: 'd' + Math.random(),
        name: email.split('@')[0].replace('.', ' ').toUpperCase(),
        email: email,
        role: 'Doctor',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop',
      };
      set({ user: doctor, role: 'Doctor', isAuthenticated: true });
      return true;
    }

    return false;
  },
  logout: () => set({ user: null, role: null, isAuthenticated: false }),
  setRole: (role) => set({ role }),
}));

interface UIState {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
}));
