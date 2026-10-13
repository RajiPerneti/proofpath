import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ProofPathLogo from '../components/ProofPathLogo';
import LiveAssessmentVisual from '../components/LiveAssessmentVisual';
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Info,
  CheckCircle2,
  Shield
} from 'lucide-react';

function GoogleIcon({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export default function AuthPage() {
  const { login, register } = useAuth();

  // Active authentication tab: 'login' or 'register'
  const [activeTab, setActiveTab] = useState('login');

  // Form input states
  const [name, setName] = useState('');
  const [email, setEmail] = useState(() => {
    return localStorage.getItem('proofpath_remember_email') || '';
  });
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(() => {
    return !!localStorage.getItem('proofpath_remember_email');
  });

  // UI state toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [googleNotice, setGoogleNotice] = useState(false);
  const [forgotNotice, setForgotNotice] = useState(false);

  const isLogin = activeTab === 'login';

  const handleTabSwitch = (tab) => {
    setError(null);
    setGoogleNotice(false);
    setForgotNotice(false);
    setActiveTab(tab);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setGoogleNotice(false);
    setForgotNotice(false);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    if (!isLogin) {
      if (!name.trim()) {
        setError('Please enter your full name.');
        return;
      }
      if (password.length < 8) {
        setError('Password must contain at least 8 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please verify your confirmation password.');
        return;
      }
    }

    // Save or clear remember-me preference
    if (rememberMe && trimmedEmail) {
      localStorage.setItem('proofpath_remember_email', trimmedEmail);
    } else {
      localStorage.removeItem('proofpath_remember_email');
    }

    setSubmitting(true);
    try {
      if (isLogin) {
        await login(trimmedEmail, password);
      } else {
        await register(name.trim(), trimmedEmail, password);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleClick = () => {
    setGoogleNotice((prev) => !prev);
  };

  const handleForgotClick = () => {
    setForgotNotice((prev) => !prev);
  };

  return (
    <div className="w-full min-h-[100dvh] flex flex-col lg:flex-row bg-[#FCFDFF] select-text">
      
      {/* ================================================================== */}
      {/* LEFT PANEL — Brain-Like AI Neural Network (45% Width on Desktop)    */}
      {/* ================================================================== */}
      <div className="w-full lg:w-[45%] lg:min-h-[100dvh] bg-gradient-to-br from-[#0B1F44] via-[#0F285A] to-[#1E40AF] text-white flex flex-col justify-between p-6 sm:p-8 lg:p-10 relative overflow-hidden border-b lg:border-b-0 lg:border-r border-blue-900/40 shrink-0">
        
        {/* Subtle Ambient Radial Lighting */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/12 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-600/12 rounded-full blur-3xl pointer-events-none" />

        {/* Top Branding & Tagline */}
        <div className="relative z-10 space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <ProofPathLogo
              className="h-10 w-10"
              variant="gradient"
              showText={true}
              textClassName="text-xl font-extrabold tracking-tight text-white"
              subtitle="AI Interview Intelligence"
              subtitleClassName="text-[11px] text-cyan-200/80 font-medium"
            />
            <span className="hidden sm:inline-flex items-center rounded-full bg-white/10 backdrop-blur-xs px-2.5 py-1 text-[10px] font-semibold text-cyan-200 border border-white/15">
              Hackathon 2026
            </span>
          </div>

          <div className="pt-1 sm:pt-2">
            <h1 className="text-2xl sm:text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Your Skills.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-200 to-indigo-200">
                Your Proof.
              </span>{' '}
              Your Path.
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md">
              Experience smarter interviews, meaningful feedback, and measurable skill improvement with AI.
            </p>
          </div>
        </div>

        {/* Central Dominant Feature: Brain-Like AI Neural Network */}
        <div className="relative z-10 my-auto py-2 sm:py-4">
          <LiveAssessmentVisual />
        </div>

        {/* Bottom Supporting Vision Text */}
        <div className="relative z-10 pt-3 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-slate-300/80">
          <p className="leading-snug">
            Practice smarter with AI-powered interviews, receive intelligent performance feedback, and take the next step toward your career goals.
          </p>
        </div>
      </div>

      {/* ================================================================== */}
      {/* RIGHT PANEL — Clean, Bright Authentication (55% Width on Desktop)   */}
      {/* ================================================================== */}
      <div className="w-full lg:w-[55%] min-h-full lg:min-h-[100dvh] bg-[#FCFDFF] flex flex-col items-center px-6 sm:px-10 lg:px-14 xl:px-16 py-10 sm:py-12">
        <div className="w-full max-w-md my-auto py-2 space-y-5 sm:space-y-6">

          {/* Header with ProofPath Logo & Welcome Heading */}
          <div className="text-center sm:text-left space-y-1.5 pt-1">
            <div className="flex items-center justify-center sm:justify-start gap-2.5 mb-2">
              <ProofPathLogo className="h-8 w-8" />
              <span className="text-lg font-bold tracking-tight text-slate-900">ProofPath</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Welcome to ProofPath
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B]">
              {isLogin
                ? 'Sign in to continue your interview assessment journey.'
                : 'Create your account to start private assessments and track skill growth.'}
            </p>
          </div>

          {/* Interactive Tabs Toggle */}
          <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold shadow-inner">
            <button
              type="button"
              onClick={() => handleTabSwitch('login')}
              className={`flex-1 rounded-lg py-2.5 transition-all cursor-pointer ${
                isLogin
                  ? 'bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 font-bold'
                  : 'text-[#64748B] hover:text-slate-900 bg-transparent'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => handleTabSwitch('register')}
              className={`flex-1 rounded-lg py-2.5 transition-all cursor-pointer ${
                !isLogin
                  ? 'bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 font-bold'
                  : 'text-[#64748B] hover:text-slate-900 bg-transparent'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Form Validation / API Error Banner */}
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/90 p-3 text-xs text-rose-800 shadow-xs"
            >
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <span className="leading-snug">{error}</span>
            </div>
          )}

          {/* Forgot Password Notice */}
          {forgotNotice && (
            <div
              role="status"
              className="flex items-start gap-2.5 rounded-xl border border-blue-200 bg-blue-50/90 p-3 text-xs text-blue-900 shadow-xs"
            >
              <Info className="h-4 w-4 shrink-0 text-blue-600 mt-0.5" />
              <span className="leading-snug">
                To reset your password in this demo environment, please contact your platform administrator or register a new account.
              </span>
            </div>
          )}

          {/* Active Form Component (Sign In vs Create Account) */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Full Name Input (Create Account Only) */}
            {!isLogin && (
              <div>
                <label
                  htmlFor="auth-name"
                  className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                >
                  Full Name
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    id="auth-name"
                    type="text"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Chen"
                    className="w-full rounded-xl border border-slate-300 pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all bg-white"
                  />
                </div>
              </div>
            )}

            {/* Email Address Input */}
            <div>
              <label
                htmlFor="auth-email"
                className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="auth-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@company.com"
                  className="w-full rounded-xl border border-slate-300 pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all bg-white"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="auth-password"
                  className="block text-[11px] font-bold uppercase tracking-wider text-slate-700"
                >
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isLogin ? '••••••••' : 'Minimum 8 characters'}
                  className="w-full rounded-xl border border-slate-300 pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password Input (Create Account Only) */}
            {!isLogin && (
              <div>
                <label
                  htmlFor="auth-confirm-password"
                  className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="auth-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    className="w-full rounded-xl border border-slate-300 pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Remember Me & Forgot Password (Sign In Only) */}
            {isLogin && (
              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={handleForgotClick}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Primary Action Button (Blue Gradient) */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 py-3 px-4 text-xs sm:text-sm font-semibold text-white shadow-md shadow-blue-600/25 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transition-all disabled:opacity-50 mt-1 cursor-pointer"
            >
              {submitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                  <span>{isLogin ? 'Signing In...' : 'Creating Account...'}</span>
                </>
              ) : (
                <>
                  <span>{isLogin ? 'Sign In to ProofPath' : 'Create Account'}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider: "or continue with" */}
          <div className="relative my-3 sm:my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-wider text-[#64748B] font-medium">
              <span className="bg-[#FCFDFF] px-2.5">or continue with</span>
            </div>
          </div>

          {/* Continue with Google Button (Prepared with Clearly Labelled Unavailable State) */}
          <div>
            <button
              type="button"
              onClick={handleGoogleClick}
              className="w-full inline-flex items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white py-2.5 px-4 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-xs cursor-pointer"
              title="Google Sign-In is not configured in this environment"
              aria-label="Continue with Google - Unavailable (Not configured)"
            >
              <GoogleIcon className="h-4 w-4 shrink-0" />
              <span>Continue with Google</span>
              <span className="ml-1 inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 border border-slate-200">
                Unavailable • Not Configured
              </span>
            </button>

            {/* Google Configuration Explanation */}
            {googleNotice && (
              <div
                role="status"
                className="mt-2.5 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/90 p-3 text-xs text-amber-900 animate-fadeIn"
              >
                <Info className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                <div className="leading-snug text-[11px]">
                  <span className="font-bold">Google Sign-In is not configured:</span>{' '}
                  External Google OAuth credentials (<code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-[10px]">GOOGLE_CLIENT_ID</code>) are required to enable Google single sign-on. Please use standard email and password authentication above.
                </div>
              </div>
            )}
          </div>

          {/* Bottom Switcher Prompt */}
          <div className="pt-1 text-center text-xs text-[#64748B]">
            {isLogin ? (
              <span>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => handleTabSwitch('register')}
                  className="font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                >
                  Create one
                </button>
              </span>
            ) : (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => handleTabSwitch('login')}
                  className="font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                >
                  Sign In
                </button>
              </span>
            )}
          </div>

          {/* Hackathon Evaluator Notice */}
          <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100 text-[11px] text-[#64748B] text-center">
            <span className="font-semibold text-slate-700">Hackathon Evaluator Notice:</span>{' '}
            You can register any test account to immediately explore private assessments, or log in with existing credentials.
          </div>

        </div>
      </div>

    </div>
  );
}
