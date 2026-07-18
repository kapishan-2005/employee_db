import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  ClipboardList,
  CalendarDays,
  Target,
  ShieldCheck,
  Landmark,
  LogOut,
  Menu,
  X,
  Settings,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/common/Footer';
import AIChat from '../components/common/AIChat';

const MainLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    ...(currentUser?.role === 'ceo'
      ? [
          { path: '/ceo/dashboard', label: 'Company', icon: Landmark },
          { path: '/ceo/users', label: 'Users', icon: ShieldCheck },
        ]
      : [{ path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }]),
    { path: '/employees', label: 'Employees', icon: Users },
    { path: '/departments', label: 'Departments', icon: Building2 },
    { path: '/attendance', label: 'Attendance', icon: ClipboardList },
    { path: '/leave', label: 'Leave', icon: CalendarDays },
    ...(currentUser?.role === 'ceo' || currentUser?.role === 'hr'
      ? [{ path: '/recruitment', label: 'Recruitment', icon: Target }]
      : []),
    ...(currentUser?.role === 'ceo' || currentUser?.role === 'hr'
      ? [{ path: '/settings/company', label: 'Settings', icon: Settings }]
      : []),
  ];

  const isActive = (path) => location.pathname === path;

  const sidebarContent = (
    <>
      {/* Brand */}
      <div className="px-5 py-6 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">EM</span>
          </div>
          <h1 className="text-base font-bold tracking-tight leading-tight">
            Employee{' '}
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
              Manager
            </span>
          </h1>
        </div>
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden text-white/50 hover:text-white p-1"
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-indigo-500/15 text-indigo-300'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={18} strokeWidth={2} className="shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User + logout */}
      <div className="px-3 py-4 border-t border-white/10">
        {currentUser && (
          <div className="px-3 mb-2">
            <p className="text-sm font-medium text-white truncate">{currentUser.username}</p>
            <p className="text-xs text-white/40 capitalize">{currentUser.role}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 bg-white/5 hover:bg-red-500/15 hover:text-red-400 border border-white/10 rounded-lg text-sm font-medium transition-colors"
        >
          <LogOut size={18} strokeWidth={2} />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#080a0f] text-white font-sans lg:flex">
      {/* Background effects */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuNjUiIG51bU9jdGF2ZXM9IjMiIHN0aXRjaFRpbGVzPSJzdGl0Y2giLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsdGVyPSJ1cmwoI25vaXNlKSIgb3BhY2l0eT0iMSIvPjwvc3ZnPg==')]" />
      <div className="pointer-events-none fixed top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
      <div className="pointer-events-none fixed bottom-0 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />

      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#0f1117]/90 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-xs">EM</span>
          </div>
          <span className="font-bold text-sm">Employee Manager</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="text-white/70 hover:text-white p-1.5"
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-[#0f1117] border-r border-white/10 flex flex-col transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex relative w-64 shrink-0 border-r border-white/10 bg-[#0f1117]/80 backdrop-blur-sm flex-col h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Main Content */}
      <div className="relative flex-1 flex flex-col min-h-screen min-w-0">
        <main className="flex-1">{children}</main>
        <Footer />
      </div>

      <AIChat />
    </div>
  );
};

export default MainLayout;
