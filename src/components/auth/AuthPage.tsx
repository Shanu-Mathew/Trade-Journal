import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { TrendingUp } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');

    setLoading(true);

    try {
      const result = isLogin
        ? await signIn(email, password)
        : await signUp(email, password);

      if (result?.error) {
        setError(result.error.message);
      } else {
        if (!isLogin) {
          setInfo(
            `A verification email has been sent to ${email}. Please check your inbox to verify your account.`
          );
          setPassword('');
        }
      }
    } catch (err) {
      setError('Unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const accent = isLogin
    ? 'from-blue-500 to-blue-600'
    : 'from-indigo-500 to-rose-500';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* -------------------- LOGO + WEBSITE NAME -------------------- */}
        <div className="flex flex-col items-center mb-8">
          <img
            src="/logo.png"
            alt="JornalX Logo"
            className="w-20 h-20 object-contain drop-shadow-md"
          />

          <h1 className="text-4xl font-extrabold mt-4 text-slate-900 dark:text-white tracking-tight">
            JornalX
          </h1>

          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Your Trading Journal, Re-imagined
          </p>
        </div>

        {/* -------------------- MAIN CARD -------------------- */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">

          <div className="flex items-center gap-3 mb-6">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${accent}`}>
              <TrendingUp className="w-7 h-7 text-white" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {isLogin ? 'Sign In' : 'Create Account'}
              </h2>

              <p className="text-sm text-slate-600 dark:text-slate-400">
                {isLogin
                  ? 'Access your trading journal'
                  : 'Start tracking your trades smartly'}
              </p>
            </div>
          </div>

          {info && (
            <div className="p-3 mb-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 rounded-lg text-sm">
              {info}
            </div>
          )}

          {error && (
            <div className="p-3 mb-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg text-white font-semibold transition-all bg-gradient-to-r ${accent} disabled:opacity-50`}
            >
              {loading ? 'Processing…' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setInfo('');
              }}
              className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
            >
              {isLogin
                ? "Don't have an account? Create one"
                : 'Already have an account? Sign In'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
