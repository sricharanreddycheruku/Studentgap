import { Activity, LayoutDashboard, LogOut, MessageCircleMore, PlusCircle, UsersRound } from 'lucide-react';
import { Link, NavLink, useNavigate } from 'react-router-dom';

const navigation = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/roster', label: 'Roster', icon: UsersRound },
  { to: '/sessions/new', label: 'New session', icon: PlusCircle },
  { to: '/whatsapp', label: 'WhatsApp', icon: MessageCircleMore }
];

const Navbar = () => {
  const navigate = useNavigate();

  const signOut = () => {
    localStorage.removeItem('classpulse-teacher');
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-[1480px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="flex min-w-0 items-center gap-3 shrink-0">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#11233f] text-white shadow-md">
            <Activity size={18} />
          </span>
          <span className="hidden sm:block">
            <span className="block text-lg font-black text-[#11233f] leading-tight">ClassPulse</span>
            <span className="block text-xs text-slate-400 leading-tight">Learning gap diagnostics</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1" aria-label="Main navigation">
          {navigation.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-[#11233f] text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <Icon size={16} />
              <span className="hidden sm:inline">{label}</span>
            </NavLink>
          ))}

          {localStorage.getItem('classpulse-teacher') && (
            <button
              type="button"
              onClick={signOut}
              title="Sign out"
              className="ml-1 grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
            >
              <LogOut size={16} />
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
