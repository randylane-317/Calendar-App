import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

const PRESET_COLORS = [
  '#B87042', '#C06060', '#7B9E7B', '#5B7FA6',
  '#9B6B8A', '#7A8A6B', '#C4956A', '#5B8A8A',
];

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', username: '', password: '', email: '', color: '#B87042',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    api.auth.setupStatus()
      .then(setStatus)
      .catch(() => setStatus({ registrationOpen: false }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (status && !status.registrationOpen) {
    return (
      <div className="auth-bg min-h-screen flex items-center justify-center p-8">
        <div className="text-center fade-up">
          <p className="font-serif text-4xl text-espresso mb-4">All set.</p>
          <p className="text-warm-500 text-sm mb-8">Both accounts have been created.</p>
          <Link to="/login" className="text-xs tracking-widest uppercase text-copper underline underline-offset-4 hover:text-copper-600 transition-colors">
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

  const isSecond = status?.userCount === 1;

  return (
    <div className="auth-bg min-h-screen flex flex-col items-center justify-center p-8">

      {/* Brand */}
      <div className="text-center mb-12 fade-up">
        <h1 className="font-serif text-5xl text-espresso tracking-tight leading-none">Our Days</h1>
        <p className="text-warm-400 text-xs tracking-[0.2em] uppercase mt-3">
          {isSecond ? 'Second account' : 'First account'}
        </p>
      </div>

      {/* Form */}
      <div className="w-full max-w-xs fade-up fade-up-delay-1">
        <form onSubmit={handleSubmit} className="space-y-7">

          <div>
            <label className="field-label">Your name</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="field-input"
              placeholder="e.g. Randy"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="field-label">Username</label>
            <input
              type="text"
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              className="field-input"
              placeholder="e.g. randy"
              autoComplete="username"
              required
            />
          </div>

          <div>
            <label className="field-label">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className="field-input"
              placeholder="choose a password"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>

          <div>
            <label className="field-label">
              Email <span className="normal-case tracking-normal text-warm-300">(for reminders)</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="field-input"
              placeholder="your@email.com"
              autoComplete="email"
            />
          </div>

          {/* Color picker */}
          <div>
            <label className="field-label">Your color</label>
            <div className="flex items-center gap-2.5 mt-1">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, color: c }))}
                  className="w-7 h-7 rounded-full transition-all focus:outline-none flex-shrink-0"
                  style={{
                    backgroundColor: c,
                    transform: form.color === c ? 'scale(1.25)' : 'scale(1)',
                    boxShadow: form.color === c ? `0 0 0 2px #FDFAF5, 0 0 0 3.5px ${c}` : 'none',
                  }}
                />
              ))}
              <input
                type="color"
                value={form.color}
                onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                className="w-7 h-7 rounded-full cursor-pointer border-0 p-0 bg-transparent"
                title="Custom color"
              />
            </div>
            {/* Preview */}
            <div className="flex items-center gap-2 mt-3">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: form.color }} />
              <span className="text-xs text-warm-400">Your events will appear in this color</span>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-700 bg-red-50 border border-red-200 px-4 py-3 tracking-wide">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 text-sm font-medium tracking-wide text-paper transition-colors duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: form.color }}
          >
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>
      </div>

      <p className="mt-10 text-xs text-warm-400 tracking-wide fade-up fade-up-delay-2">
        Already have an account?{' '}
        <Link to="/login" className="text-copper underline underline-offset-4 hover:text-copper-600 transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}
