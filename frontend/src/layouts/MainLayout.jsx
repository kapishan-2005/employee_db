import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  ClipboardList,
  Target,
  ShieldCheck,
  Landmark,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/common/Footer';
import AIChat from '../components/common/AIChat';

const MainLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useAuth();

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
      : []),
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/employees', label: 'Employees', icon: Users },
    { path: '/departments', label: 'Departments', icon: Building2 },
    { path: '/attendance', label: 'Attendance', icon: ClipboardList },
    ...(currentUser?.role === 'ceo' || currentUser?.role === 'admin'
      ? [{ path: '/recruitment', label: 'Recruitment', icon: Target }]
      : []),
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-[#080a0f] text-white font-sans flex">
      {/* Background effects */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuNjUiIG51bU9jdGF2ZXM9IjMiIHN0aXRjaFRpbGVzPSJzdGl0Y2giLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsdGVyPSJ1cmwoI25vaXNlKSIgb3BhY2l0eT0iMSIvPjwvc3ZnPg==')]" />
      <div className="pointer-events-none fixed top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
      <div className="pointer-events-none fixed bottom-0 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />

      {/* Sidebar */}
      <aside className="relative w-64 shrink-0 border-r border-white/10 bg-[#0f1117]/80 backdrop-blur-sm flex flex-col h-screen sticky top-0">
        {/* Brand */}
        <div className="px-5 py-6 border-b border-white/10">
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
      </aside>

      {/* Main Content */}
      <div className="relative flex-1 flex flex-col min-h-screen">
        <main className="flex-1">{children}</main>
        <Footer />
      </div>

      <AIChat />
    </div>
  );
};

export default MainLayout;
