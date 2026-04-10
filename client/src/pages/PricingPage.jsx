import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../hooks/useApi';
import Navbar from '../components/Navbar';

const FREE_FEATURES = [
  'Up to 3 boards',
  'Unlimited tasks',
  'Real-time updates',
  'Solo use only',
];

const PRO_FEATURES = [
  'Unlimited boards',
  'Team collaboration',
  'Invite members by email',
  'Role-based permissions',
  'Priority support',
  'Everything in Free',
];

export default function PricingPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/payments/create-checkout');
      window.location.href = data.url;
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to start checkout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {user && <Navbar />}

      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Header */}
        {!user && (
          <div className="text-center mb-4">
            <Link to="/" className="font-mono font-bold text-white text-xl">⚡ TaskFlow</Link>
          </div>
        )}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-white">Simple, honest pricing</h1>
          <p className="text-gray-500 mt-2">Start free. Upgrade when your team grows.</p>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Free */}
          <div className="card border-gray-700">
            <div className="mb-5">
              <h2 className="text-lg font-bold text-white">Free</h2>
              <div className="mt-2">
                <span className="text-4xl font-bold text-white">$0</span>
                <span className="text-gray-500 ml-2">/ forever</span>
              </div>
            </div>

            <ul className="space-y-2.5 mb-6">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-400">
                  <span className="text-emerald-400">✓</span>
                  {f}
                </li>
              ))}
            </ul>

            {user?.plan === 'free' ? (
              <div className="w-full text-center py-2 rounded-lg bg-gray-800 text-gray-500 text-sm font-medium">
                Current plan
              </div>
            ) : (
              <Link to="/dashboard" className="btn-ghost w-full justify-center">
                Get started
              </Link>
            )}
          </div>

          {/* Pro */}
          <div className="card border-brand-500/50 bg-gradient-to-b from-brand-500/5 to-transparent relative overflow-hidden">
            {/* Popular badge */}
            <div className="absolute top-4 right-4">
              <span className="text-xs bg-brand-500 text-white px-2 py-0.5 rounded-full font-medium">
                Most Popular
              </span>
            </div>

            <div className="mb-5">
              <h2 className="text-lg font-bold text-white">Pro</h2>
              <div className="mt-2">
                <span className="text-4xl font-bold text-white">$9</span>
                <span className="text-gray-500 ml-2">/ month</span>
              </div>
            </div>

            <ul className="space-y-2.5 mb-6">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                  <span className="text-brand-400">✦</span>
                  {f}
                </li>
              ))}
            </ul>

            {user?.plan === 'pro' ? (
              <div className="w-full text-center py-2 rounded-lg bg-brand-500/20 text-brand-400 text-sm font-medium border border-brand-500/30">
                ✦ Active Pro plan
              </div>
            ) : (
              <button
                onClick={handleUpgrade}
                disabled={loading}
                className="btn-primary w-full justify-center"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Redirecting...
                  </>
                ) : (
                  'Upgrade to Pro →'
                )}
              </button>
            )}
          </div>
        </div>

        {/* FAQ snippet */}
        <div className="mt-12 text-center text-sm text-gray-600">
          <p>Payments secured by Stripe · Cancel anytime · No hidden fees</p>
        </div>
      </div>
    </div>
  );
}
