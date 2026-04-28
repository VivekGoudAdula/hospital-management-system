import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Building2, 
  UserRound, 
  Users, 
  Files, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Stethoscope,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useUIStore, useAuthStore } from '@/store';
import { motion } from 'framer-motion';

const Sidebar = () => {
  const { isSidebarOpen, toggleSidebar } = useUIStore();
  const { role, logout } = useAuthStore();
  const navigate = useNavigate();

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['Admin', 'Doctor'] },
    { name: 'Departments', icon: Building2, path: '/departments', roles: ['Admin'] },
    { name: 'Doctors', icon: UserRound, path: '/doctors', roles: ['Admin'] },
    { name: 'Patients', icon: Users, path: '/patients', roles: ['Admin', 'Doctor'] },
    { name: 'Documents', icon: Files, path: '/documents', roles: ['Admin', 'Doctor'] },
    { name: 'Settings', icon: Settings, path: '/settings', roles: ['Admin', 'Doctor'] },
  ];

  const filteredItems = menuItems.filter(item => role && item.roles.includes(role));

  const handleLogout = () => {
    logout();
    import('sonner').then(({ toast }) => toast.success('Logged out successfully'));
    navigate('/login');
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: isSidebarOpen ? 240 : 80 }}
      className={cn(
        "relative h-screen bg-white border-r border-slate-200 transition-all duration-300 ease-in-out flex flex-col z-50",
        !isSidebarOpen && "items-center"
      )}
    >
      <div className={cn(
        "p-6 flex items-center gap-3",
        !isSidebarOpen && "justify-center px-0 h-16"
      )}>
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
          <Stethoscope className="w-5 h-5 text-white" />
        </div>
        {isSidebarOpen && (
          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-bold text-lg tracking-tight text-slate-800"
          >
            ApexCare
          </motion.span>
        )}
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {filteredItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center px-3 py-2 rounded-md transition-all duration-200 group",
              isActive 
                ? "bg-indigo-50 text-indigo-600 font-medium" 
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <item.icon className={cn("h-5 w-5", isSidebarOpen && "mr-3")} />
            {isSidebarOpen && (
              <span className="text-sm">{item.name}</span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100 flex flex-col gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="w-full justify-start text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md px-3"
        >
          <LogOut className="h-4 w-4 mr-3" />
          {isSidebarOpen && <span className="text-sm">Logout</span>}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="w-full justify-start text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-md px-3"
        >
          {isSidebarOpen ? <ChevronLeft className="h-4 w-4 mr-3" /> : <ChevronRight className="h-4 w-4" />}
          {isSidebarOpen && <span className="text-sm text-slate-400 font-medium">Collapse</span>}
        </Button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
