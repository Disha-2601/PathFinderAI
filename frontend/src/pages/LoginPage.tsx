import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Lock, Mail, ArrowRight, UserCheck, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DEMO_EMAIL = 'alex.rivera@pathfinder.ai';
const DEMO_PASSWORD = 'password123';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState<string>(DEMO_EMAIL);
  const [password, setPassword] = useState<string>(DEMO_PASSWORD);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const { login, loginDemoUser, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      navigate('/dashboard');
    }
  };

  const handleDemoLogin = async () => {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    const success = await loginDemoUser();
    if (success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-white/90 border border-slate-200/90 rounded-3xl p-8 backdrop-blur-2xl shadow-2xl relative z-10 dark:bg-slate-900/80 dark:border-slate-800/90">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center gap-3 mb-4">
            <img
              src="/pathfinder-logo.png"
              alt="PathFinder AI logo"
              className="w-14 h-14 rounded-2xl object-cover shadow-xl shadow-cyan-500/20"
            />
            <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent">
              PathFinder<span className="text-slate-950 dark:text-white ml-1 font-semibold text-sm px-1.5 py-0.5 rounded bg-cyan-100 dark:bg-cyan-950 border border-cyan-500/30 align-middle">AI</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight">
            Sign In to PathFinder
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
            AI-powered career roadmap generator & milestone tracker
          </p>
        </div>

        {/* Demo Fast Login Banner */}
        <div className="mb-6 p-3.5 rounded-2xl bg-gradient-to-r from-cyan-50 to-indigo-50 border border-cyan-500/30 flex items-center justify-between dark:from-cyan-950/70 dark:to-indigo-950/70">
          <div className="flex items-center space-x-2.5">
            <UserCheck className="w-5 h-5 text-cyan-400 flex-shrink-0" />
            <div className="text-left text-xs">
              <p className="font-semibold text-slate-950 dark:text-white">Pre-Configured Demo User</p>
              <p className="text-slate-500 dark:text-slate-400">Alex Rivera (alex.rivera@pathfinder.ai)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95 flex items-center space-x-1"
          >
            <span>1-Click Login</span>
            <Sparkles className="w-3.5 h-3.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300/90 rounded-xl text-slate-950 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400 transition-all dark:bg-slate-950/90 dark:border-slate-700/80 dark:text-slate-100 dark:placeholder-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-12 py-3 bg-white border border-slate-300/90 rounded-xl text-slate-950 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400 transition-all dark:bg-slate-950/90 dark:border-slate-700/80 dark:text-slate-100 dark:placeholder-slate-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword((isVisible) => !isVisible)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-300 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center space-x-2 mt-2 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-cyan-400 font-semibold hover:underline">
            Create an Account
          </Link>
        </p>
      </div>
    </div>
  );
};
