import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [canRegister, setCanRegister] = useState(false);

  useEffect(() => {
    api.auth.setupStatus()
      .then(({ registrationOpen }) => setCanRegister(registrationOpen))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg min-h-screen flex flex-col items-center justify-center p-8">

      {/* Brand */}
      <div className="text-center mb-14 fade-up">
        <h1 className="font-serif text-5xl sm:text-6xl text-espresso tracking-tight leading-none">
          Our Days
        </h1>
        <p className="text-warm-400 text-xs tracking-[0.2em] uppercase mt-3">Shared Calendar</p>
      </div>

      {/* Form */}
      <div className="w-full max-w-xs fade-up fade-up-delay-1">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label className="field-label">Username</label>
            <input
              type="text"
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              className="field-input"
              placeholder="your username"
              autoComplete="username"
              autoFocus
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
              placeholder="your password"
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <p className="text-xs text-red-700 bg-red-50 border border-red-200 px-4 py-3 tracking-wide">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="btn-dark">
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>

      {/* Footer */}
      <div className="mt-10 fade-up fade-up-delay-2">
        {canRegister ? (
          <p className="text-xs text-warm-400 tracking-wide text-center">
            First time here?{' '}
            <Link to="/register" className="text-copper underline underline-offset-4 hover:text-copper-600 transition-colors">
              Create your account
            </Link>
          </p>
        ) : (
          <p className="text-xs text-warm-300 tracking-wide text-center">
            — Dedicated to Tayden —
          </p>
        )}
      </div>
    </div>
  );
}
