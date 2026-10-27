import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HeartPulse, Mail, Lock, ArrowRight } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const user = await login(email, password, rememberMe);
      if (user?.role === 'caregiver') {
        navigate('/caregiver');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      let message = 'Invalid login credentials. Please try again.';
      if (err.response?.data?.error) {
        message = err.response.data.error;
      } else if (err.response?.data?.message) {
        message = err.response.data.message;
      } else if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        message = 'Unable to reach backend server. If using Render free tier, the service may be spinning up (~45s). Also check if your backend CORS and database whitelist are configured.';
      } else if (err.response?.status === 502) {
        message = 'Backend server returned 502 Bad Gateway. The server failed to connect to MongoDB Atlas (ensure 0.0.0.0/0 is whitelisted in Atlas Network Access).';
      } else if (err.response?.status === 403) {
        message = 'Access forbidden: Request origin is not allowed by backend CORS.';
      } else if (err.message) {
        message = err.message;
      }
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      background: 'radial-gradient(circle at top right, rgba(99, 102, 241, 0.15), transparent 40%), var(--bg-primary)',
    }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '440px', padding: '2.5rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--accent-primary) 0%, #4338ca 100%)',
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem auto',
            boxShadow: '0 8px 20px rgba(99, 102, 241, 0.4)',
          }}>
            <HeartPulse size={32} color="#fff" />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff' }}>Welcome Back</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Sign in to MediTrack to manage medication compliance
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: '#f43f5e',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.875rem',
            marginBottom: '1.25rem',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="email"
                className="form-input"
                style={{ paddingLeft: '2.75rem' }}
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="password"
                className="form-input"
                style={{ paddingLeft: '2.75rem' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Remember me
            </label>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%' }}
            disabled={submitting}
          >
            <span>{submitting ? 'Signing in...' : 'Sign In'}</span>
            <ArrowRight size={18} />
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>
            Register Now
          </Link>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
