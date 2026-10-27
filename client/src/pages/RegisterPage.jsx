import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HeartPulse, Mail, Lock, User, UserCheck, Phone, ArrowRight } from 'lucide-react';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('patient');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('prefer_not_to_say');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const user = await register({
        name,
        email,
        password,
        role,
        age: age ? Number(age) : undefined,
        gender,
        phone,
      });

      if (user?.role === 'caregiver') {
        navigate('/caregiver');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      let message = 'Registration failed. Please check your information.';
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
      padding: '2rem 1.5rem',
      background: 'radial-gradient(circle at top left, rgba(20, 184, 166, 0.15), transparent 40%), var(--bg-primary)',
    }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '480px', padding: '2.5rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--accent-teal) 0%, var(--accent-primary) 100%)',
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem auto',
            boxShadow: '0 8px 20px rgba(20, 184, 166, 0.4)',
          }}>
            <HeartPulse size={32} color="#fff" />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff' }}>Create Account</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Join MediTrack as a Patient or Caregiver
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
          {/* Role Selection Tabs */}
          <div className="form-group">
            <label className="form-label">I am registering as a:</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                type="button"
                className={`btn ${role === 'patient' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setRole('patient')}
                style={{ padding: '0.65rem' }}
              >
                <User size={18} /> Patient
              </button>
              <button
                type="button"
                className={`btn ${role === 'caregiver' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setRole('caregiver')}
                style={{ padding: '0.65rem' }}
              >
                <UserCheck size={18} /> Caregiver
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Jane Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}"
              title="Use at least 8 characters, including uppercase and lowercase letters, a number, and a symbol."
            />
            <small style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
              Use at least 8 characters with uppercase and lowercase letters, a number, and a symbol.
            </small>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Age</label>
              <input
                type="number"
                className="form-input"
                placeholder="e.g. 35"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                min={1}
                max={120}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Gender</label>
              <select
                className="form-select"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="prefer_not_to_say">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input
              type="tel"
              className="form-input"
              placeholder="+1 (555) 000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={submitting}
          >
            <span>{submitting ? 'Creating Account...' : 'Register Account'}</span>
            <ArrowRight size={18} />
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ fontWeight: 700, color: 'var(--accent-teal)' }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
