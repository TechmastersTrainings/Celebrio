import React, { useState } from 'react';
import { ApiService } from '../../services/api';
import { TechMastersLogo } from '../../components/TechMastersLogo';
import { LogIn, UserPlus, AlertCircle, CheckCircle2, ShieldCheck, Lock, Code, ArrowLeft } from 'lucide-react';

interface DeveloperAuthPageProps {
  onLoginSuccess: (user: any) => void;
  onNavigate?: (view: string) => void;
}

export const DeveloperAuthPage: React.FC<DeveloperAuthPageProps> = ({ onLoginSuccess, onNavigate }) => {
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
      setError('Please provide corporate email and password.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const user = await ApiService.staffLogin(email, password);

      // Validate developer status or admin supervision
      if (user.approval_status === 'REJECTED' || user.approval_status === 'SUSPENDED') {
        localStorage.removeItem('celebrio_staff_token');
        localStorage.removeItem('celebrio_staff_user');
        setError('Access Inactive: Your developer account has been suspended or rejected by administration.');
        return;
      }

      onLoginSuccess(user);
    } catch (err: any) {
      setError(err.message || 'Developer authentication failed. Verify credentials.');
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
      setRegSuccess(res.message || 'Developer application submitted successfully! It is now pending Administrator approval.');
      setIsRegister(false);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '520px', margin: '4rem auto 6rem', padding: '0 1.25rem' }}>
      <div
        className="card card-gold-accent"
        style={{
          padding: '3rem 2.5rem',
          background: '#FFFFFF',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 16px 40px rgba(13, 27, 42, 0.10)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'center' }}>
            <TechMastersLogo variant="header" size="md" />
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 0.85rem',
              borderRadius: 'var(--radius-full)',
              background: 'linear-gradient(135deg, rgba(107, 23, 40, 0.08), rgba(184, 142, 62, 0.12))',
              color: 'var(--burgundy-rich)',
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '0.75rem',
              border: '1px solid rgba(107, 23, 40, 0.2)',
            }}
          >
            <Code size={14} style={{ color: 'var(--burgundy-rich)' }} />
            <span>Developer &amp; Artisan Workspace</span>
          </div>

          <h1 style={{ fontSize: '1.8rem', color: 'var(--navy-deep)', margin: '0.25rem 0 0.5rem', fontFamily: 'var(--font-serif)' }}>
            {isRegister ? 'Developer Registration' : 'Developer Portal Sign In'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0, lineHeight: 1.5 }}>
            {isRegister
              ? 'Join our artisan creative team. Approved developers receive assigned orders and design tasks.'
              : 'Sign in to access your assigned order queue, preview generator & customer revision tools.'}
          </p>
        </div>

        {error && (
          <div
            style={{
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              color: 'var(--color-danger)',
              padding: '0.85rem 1.15rem',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '1.5rem',
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.6rem',
              lineHeight: 1.5,
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
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
              gap: '0.6rem',
              lineHeight: 1.5,
            }}
          >
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <span>{regSuccess}</span>
          </div>
        )}

        <form onSubmit={isRegister ? handleRegister : handleLogin}>
          {isRegister && (
            <>
              <div className="form-group" style={{ marginBottom: '1.15rem' }}>
                <label className="form-label" style={{ fontWeight: 600, color: 'var(--navy-deep)', display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Priya Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.75rem 0.9rem', fontSize: '0.92rem' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.15rem' }}>
                <label className="form-label" style={{ fontWeight: 600, color: 'var(--navy-deep)', display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                  Phone Number
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. +91 98860 12345"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem 0.9rem', fontSize: '0.92rem' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.15rem' }}>
                <label className="form-label" style={{ fontWeight: 600, color: 'var(--navy-deep)', display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                  Portfolio URL
                </label>
                <input
                  type="url"
                  className="form-control"
                  placeholder="https://behance.net/..."
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem 0.9rem', fontSize: '0.92rem' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.15rem' }}>
                <label className="form-label" style={{ fontWeight: 600, color: 'var(--navy-deep)', display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                  Creative Skills (Comma-separated)
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="HTML, CSS, Kannada Typography, Video Motion"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem 0.9rem', fontSize: '0.92rem' }}
                />
              </div>
            </>
          )}

          <div className="form-group" style={{ marginBottom: '1.15rem' }}>
            <label className="form-label" style={{ fontWeight: 600, color: 'var(--navy-deep)', display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
              Corporate Email Address *
            </label>
            <input
              type="email"
              className="form-control"
              placeholder="e.g. sachin@techmastersinnovatons.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              style={{ width: '100%', padding: '0.75rem 0.9rem', fontSize: '0.92rem' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.35rem' }}>
            <label className="form-label" style={{ fontWeight: 600, color: 'var(--navy-deep)', display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
              Secure Password *
            </label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '0.75rem 0.9rem', fontSize: '0.92rem' }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '0.85rem',
              fontWeight: 700,
              fontSize: '0.94rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
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
                <span>Sign In to Developer Workspace</span>
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
              ? 'Already registered? Sign in to Developer Workspace'
              : 'New TechMasters creative? Register developer profile'}
          </button>
        </div>

        {/* Alternate Portals Navigation */}
        <div
          style={{
            marginTop: '1.75rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem',
            textAlign: 'center',
            fontSize: '0.84rem',
          }}
        >
          {onNavigate && (
            <>
              <button
                onClick={() => onNavigate('admin-login')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--navy-deep)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
                }}
              >
                <ShieldCheck size={14} style={{ color: 'var(--gold-primary)' }} />
                <span>Operations Administrator? Sign in to Admin Portal</span>
              </button>

              <button
                onClick={() => onNavigate('home')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
                }}
              >
                <ArrowLeft size={13} />
                <span>Return to Public Customer Website</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
