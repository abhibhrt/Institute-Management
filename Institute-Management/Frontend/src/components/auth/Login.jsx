import { useState } from 'react';
import API from '../../api/axiosClient';
import { APP_CONFIG } from '../../config/appConfig';

// Icons using clean SVG equivalents to match the design
function GraduationCapIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0v6" />
    </svg>
  );
}

function TeacherIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function AdminIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  );
}

function SparklesIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.286L13 21l-2.286-6.857L5 12l5.714-2.286L13 3z" />
    </svg>
  );
}

function ShieldCheckIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

const roleConfigs = {
  student: {
    label: 'Student',
    icon: GraduationCapIcon,
    iconBg: 'bg-blue-600',
    description: 'Your result, weak topics, AI study plan and resources',
    placeholder: 'student@school.com',
  },
  teacher: {
    label: 'Teacher',
    icon: TeacherIcon,
    iconBg: 'bg-purple-600',
    description: 'Class performance metrics, analytics, and intervention plans',
    placeholder: 'teacher@school.com',
  },
  admin: {
    label: 'Admin',
    icon: AdminIcon,
    iconBg: 'bg-amber-600',
    description: 'System-wide settings, user administration, and batch imports',
    placeholder: 'admin@college.com',
  },
};

export default function Login({ onLoginSuccess }) {
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await API.post('/users/login', { email, password, role });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.role);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      onLoginSuccess(res.data.role, res.data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#f8fafc]">
      {/* Left Column: Brand & Hero Showcase */}
      <div className="w-full md:w-1/2 bg-gradient-to-br from-[#0c1330] via-[#0b1b42] to-[#080d21] p-8 md:p-14 lg:p-20 text-white flex flex-col justify-between relative overflow-hidden">
        {/* Subtle decorative radial glow */}
        <div className="absolute top-[-15%] left-[-15%] w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          {/* Logo badge */}
          <div className="flex items-center gap-3 mb-14">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <GraduationCapIcon className="w-6 h-6" />
            </div>
            <span className="font-semibold text-lg tracking-tight text-white">
              {APP_CONFIG.APP_NAME || 'Result Intelligence'}
            </span>
          </div>

          <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-md mb-10 font-normal">
            Marks are imported, ranked and broken down to the topic. Claude turns the analytics into a study plan for students and an intervention list for teachers.
          </p>

          {/* Feature list pills */}
          <div className="space-y-3 max-w-md">
            <div className="flex items-center gap-3.5 text-xs md:text-sm text-slate-200">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 text-slate-300">
                <SparklesIcon />
              </div>
              <span>AI feedback grounded in the real numbers</span>
            </div>

            <div className="flex items-center gap-3.5 text-xs md:text-sm text-slate-200">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 text-slate-300">
                <TeacherIcon className="w-4 h-4" />
              </div>
              <span>Class split into four score bands</span>
            </div>

            <div className="flex items-center gap-3.5 text-xs md:text-sm text-slate-200">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 text-slate-300">
                <ShieldCheckIcon />
              </div>
              <span>Topic-level strengths and weaknesses</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 mt-12 pt-6 text-xs text-slate-500 font-mono">
          Spring Boot 3 · MySQL · Spring Batch · Claude
        </div>
      </div>

      {/* Right Column: Sign In Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12 lg:p-16 bg-white">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Sign in</h2>
            <p className="text-sm text-gray-500 mt-1">
              One form for every role — your account decides what you see.
            </p>
          </div>

          {/* Role selector cards */}
          <div className="grid grid-cols-3 gap-3 mb-2">
            {(['student', 'teacher', 'admin']).map((r) => {
              const config = roleConfigs[r];
              const Icon = config.icon;
              const isSelected = role === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`flex flex-col items-start p-3.5 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/20 shadow-sm ring-1 ring-blue-600'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg ${config.iconBg} text-white flex items-center justify-center mb-3 shadow-sm`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span
                    className={`text-xs font-semibold ${
                      isSelected ? 'text-gray-900' : 'text-gray-700'
                    }`}
                  >
                    {config.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Helper caption for current role */}
          <p className="text-[11px] text-gray-400 mb-6">
            {roleConfigs[role].description}
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs">
              {error}
            </div>
          )}

          {/* Sign-in Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Username or e-mail
              </label>
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={roleConfigs[role].placeholder}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.75}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.75}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-[#4f6ef7] hover:bg-[#435fe3] active:bg-[#3b55ce] text-white text-sm font-medium transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign in</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}