import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Sparkles, Map, LogOut, Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/80 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <img
              src="/pathfinder-logo.png"
              alt="PathFinder AI logo"
              className="w-10 h-10 rounded-xl object-cover shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all duration-300"
            />
            <div>
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                PathFinder<span className="text-slate-950 dark:text-white ml-1 font-semibold text-sm px-1.5 py-0.5 rounded bg-cyan-100 dark:bg-cyan-950 border border-cyan-500/30">AI</span>
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center space-x-1">
              <Link
                to="/dashboard"
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive('/dashboard')
                    ? 'bg-cyan-50 text-cyan-700 border border-cyan-500/30 shadow-sm dark:bg-slate-800/90 dark:text-cyan-400'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-900/60'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>

              <Link
                to="/parse"
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive('/parse')
                    ? 'bg-cyan-50 text-cyan-700 border border-cyan-500/30 shadow-sm dark:bg-slate-800/90 dark:text-cyan-400'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-900/60'
                }`}
              >
                <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                <span>AI Goal Parser</span>
              </Link>

              <Link
                to="/pathway"
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive('/pathway')
                    ? 'bg-cyan-50 text-cyan-700 border border-cyan-500/30 shadow-sm dark:bg-slate-800/90 dark:text-cyan-400'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-900/60'
                }`}
              >
                <Map className="w-4 h-4 text-indigo-400" />
                <span>Learning Roadmap</span>
              </Link>
            </nav>
          )}

          {/* User Profile & Actions */}
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-950 hover:bg-slate-100 transition-all border border-slate-200/80 dark:text-slate-400 dark:hover:text-cyan-300 dark:hover:bg-slate-900/60 dark:border-slate-800"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            {isAuthenticated && user ? (
              <div className="flex items-center space-x-3">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{user.full_name}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user.role} • {user.experience_level || 'Intermediate'}</span>
                </div>
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md border border-cyan-400/30">
                  {user.full_name.charAt(0).toUpperCase()}
                </div>
                <button
                  onClick={logout}
                  title="Log out"
                  className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all border border-transparent hover:border-rose-500/20 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-rose-950/30"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-950 hover:bg-slate-100 rounded-lg transition-all dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 rounded-lg shadow-md shadow-cyan-600/20 transition-all"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
