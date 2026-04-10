import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2 font-bold text-white">
          <span className="text-xl">⚡</span>
          <span className="font-mono">TaskFlow</span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Live indicator */}
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                connected ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600'
              }`}
            />
            {connected ? 'Live' : 'Offline'}
          </div>

          {/* Plan badge */}
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              user?.plan === 'pro'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-gray-800 text-gray-400'
            }`}
          >
            {user?.plan === 'pro' ? '✦ Pro' : 'Free'}
          </span>

          {user?.plan === 'free' && (
            <Link to="/pricing" className="btn-primary text-xs py-1.5">
              Upgrade
            </Link>
          )}

          {/* User menu */}
          <div className="flex items-center gap-2 pl-3 border-l border-gray-800">
            <div className="w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center text-xs font-bold text-white">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <span className="text-sm text-gray-300 hidden sm:block">{user?.name}</span>
            <button onClick={handleLogout} className="btn-ghost text-xs py-1.5">
              Sign out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
