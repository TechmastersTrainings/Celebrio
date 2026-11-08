import React, { useState } from 'react';
import { ApiService } from '../../services/api';

interface DeveloperAuthPageProps {
  onLoginSuccess: (user: any) => void;
}

export const DeveloperAuthPage: React.FC<DeveloperAuthPageProps> = ({ onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [skills, setSkills] = useState('HTML, CSS, UI/UX, Wedding Invitations');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide email and password.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const user = await ApiService.staffLogin(email, password);
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      setError('Please provide email, password, and full name.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const skillList = skills.split(',').map((s) => s.trim()).filter(Boolean);
      const res: any = await ApiService.registerDeveloper({
        email,
        password,
        full_name: fullName,
        phone_number: phoneNumber || undefined,
        portfolio_url: portfolioUrl || undefined,
        skills: skillList,
      });
      setRegSuccess(res.message);
      setIsRegister(false);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '480px', margin: '3rem auto' }}>
      <div className="card" style={{ padding: '2.5rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🛠️</div>
          <h2 style={{ fontSize: '1.6rem', color: 'var(--color-primary-dark)' }}>
            {isRegister ? 'Developer Account Registration' : 'Internal Staff & Developer Sign In'}
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            TechMasters Digital Celebrations Internal Workspace
          </p>
        </div>

        {error && (
          <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', color: 'var(--color-danger)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        {regSuccess && (
          <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#047857', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
            {regSuccess}
          </div>
        )}

        <form onSubmit={isRegister ? handleRegister : handleLogin}>
          {isRegister && (
            <>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Priya Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. +91 98860 12345"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Portfolio URL</label>
                <input
                  type="url"
                  className="form-control"
                  placeholder="https://..."
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Skills (Comma-separated)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="HTML, CSS, Kannada, Video Sync"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">Internal Email Address *</label>
            <input
              type="email"
              className="form-control"
              placeholder="priya.dev@techmasters.internal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password *</label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading ? 'Processing...' : isRegister ? 'Submit for Admin Approval' : 'Sign In to Workspace'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
          {isRegister ? (
            <span style={{ color: 'var(--color-text-muted)' }}>
              Already have an account?{' '}
              <a href="#login" style={{ color: 'var(--color-primary)', fontWeight: 600 }} onClick={(e) => { e.preventDefault(); setIsRegister(false); }}>
                Sign In
              </a>
            </span>
          ) : (
            <span style={{ color: 'var(--color-text-muted)' }}>
              New TechMasters designer?{' '}
              <a href="#register" style={{ color: 'var(--color-primary)', fontWeight: 600 }} onClick={(e) => { e.preventDefault(); setIsRegister(true); }}>
                Register Account
              </a>
            </span>
          )}
        </div>

        <div style={{ marginTop: '1.75rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
          <strong>Default Seed Accounts:</strong>
          <ul style={{ listStyle: 'none', marginTop: '0.35rem', lineHeight: 1.5 }}>
            <li>Admin: <code>admin@techmasters.internal</code></li>
            <li>Approved Dev: <code>priya.dev@techmasters.internal</code></li>
            <li>Video Specialist: <code>vikram.video@techmasters.internal</code></li>
          </ul>
          <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            Passwords are set during <code>python manage.py seed_catalog</code> using <code>.env</code> variables or generated securely.
          </div>
        </div>
      </div>
    </div>
  );
};

