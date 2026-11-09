import React, { useState } from 'react';
import { ApiService } from '../../services/api';
import { TechMastersLogo } from '../../components/TechMastersLogo';
import { LogIn, UserPlus, AlertCircle, CheckCircle2, ShieldCheck, Lock } from 'lucide-react';

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
      setError(err.message || 'Login failed. Please check credentials.');
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
    <div style={{ maxWidth: '500px', margin: '4rem auto 6rem', padding: '0 1rem' }}>
      <div className="card card-gold-accent" style={{ padding: '3rem 2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <TechMastersLogo variant="header" size="md" />
          </div>
          <span className="editorial-kicker">INTERNAL PRODUCTION OPERATIONS</span>
          <h2 style={{ fontSize: '1.75rem', color: 'var(--navy-deep)' }}>
            {isRegister ? 'Developer Registration' : 'Internal Staff & Developer Sign In'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.35rem' }}>
            TechMasters Innovations Production Operations Platform
          </p>
        </div>

        {error && (
          <div
            style={{
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              color: 'var(--color-danger)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '1.5rem',
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {regSuccess && (
          <div
            style={{
              background: '#F0FDF4',
              border: '1px solid #BBF7D0',
              color: '#166534',
              padding: '0.85rem 1.25rem',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '1.5rem',
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <CheckCircle2 size={18} />
            <span>{regSuccess}</span>
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
                  required
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
                  placeholder="HTML, CSS, Kannada, Video Production"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">Corporate Email Address *</label>
            <input
              type="email"
              className="form-control"
              placeholder="e.g. dev@techmastersinnovations.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Secure Password *</label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.75rem' }}
            disabled={loading}
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : isRegister ? (
              <>
                <UserPlus size={16} />
                <span>Submit Developer Application</span>
              </>
            ) : (
              <>
                <LogIn size={16} />
                <span>Sign In to Production Workspace</span>
              </>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.75rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
          <button
            onClick={() => { setIsRegister(!isRegister); setError(null); }}
            style={{ background: 'none', border: 'none', color: 'var(--burgundy-rich)', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' }}
          >
            {isRegister
              ? 'Already registered? Sign in here'
              : 'New TechMasters creative? Register developer profile'}
          </button>
        </div>

        <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
          <ShieldCheck size={14} style={{ color: 'var(--gold-primary)' }} />
          <span>Role-Gated Access &bull; Admin Approval Required for New Accounts</span>
        </div>
      </div>
    </div>
  );
};
