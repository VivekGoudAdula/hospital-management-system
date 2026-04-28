import { create } from 'zustand';
import { User, UserRole } from '../types';
import { useHospitalStore } from './hospitalStore';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  role: UserRole | null;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => void;
  setRole: (role: UserRole) => void;
}

const API_URL = 'http://localhost:8000/api';

export const useAuthStore = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  role: localStorage.getItem('role') as UserRole | null,
  
  login: async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        // Extract the detail message from the FastAPI error response
        const errData = await response.json().catch(() => ({}));
        const message = errData?.detail || 'Invalid email or password.';
        return message;
      }

      const data = await response.json();
      
      const user: User = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.role.charAt(0).toUpperCase() + data.role.slice(1),
        avatar: `https://i.pravatar.cc/150?u=${data.user.id}`,
      };

      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('role', user.role);

      set({ 
        user, 
        token: data.access_token, 
        role: user.role as UserRole, 
        isAuthenticated: true 
      });
      
      return null; // null means success
    } catch (error) {
      console.error('Login error:', error);
      return 'Network error. Please check your connection.';
    }
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    set({ user: null, token: null, role: null, isAuthenticated: false });
  },
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
