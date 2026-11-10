import React, { useState } from 'react';
import { ApiService } from '../../services/api';
import { TechMastersLogo } from '../../components/TechMastersLogo';
import { ShieldCheck, Lock, AlertCircle, ArrowRight, UserCheck, KeyRound, ArrowLeft } from 'lucide-react';

interface AdminAuthPageProps {
  onLoginSuccess: (user: any) => void;
  onNavigate: (view: string) => void;
}

export const AdminAuthPage: React.FC<AdminAuthPageProps> = ({ onLoginSuccess, onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide corporate administrator email and password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const user = await ApiService.staffLogin(email, password);

      // Enforce Admin Role Gate
      if (!user.is_admin && user.role !== 'SUPER_ADMIN' && user.role !== 'OPS_ADMIN') {
        // Clear stored tokens since user is unauthorized for admin portal
        localStorage.removeItem('celebrio_staff_token');
        localStorage.removeItem('celebrio_staff_user');
        setError(
          `Access Denied: Account (${email}) does not possess Super-Administrator privileges. Creative artisans and developers must log in via the Developer Portal.`
        );
        return;
      }

      onLoginSuccess(user);
    } catch (err: any) {
      setError(err.message || 'Administrator authentication failed. Verify credentials.');
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
          boxShadow: '0 16px 40px rgba(13, 27, 42, 0.12)',
          border: '1px solid var(--border-medium)',
        }}
      >
        {/* Brand Lockup */}
        <div style={{ textAlign: 'center', marginBottom: '2.25rem' }}>
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
              background: 'linear-gradient(135deg, rgba(13, 27, 42, 0.08), rgba(184, 142, 62, 0.15))',
              color: 'var(--navy-deep)',
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '0.75rem',
              border: '1px solid rgba(184, 142, 62, 0.3)',
            }}
          >
            <ShieldCheck size={14} style={{ color: 'var(--gold-primary)' }} />
            <span>Central Administration &bull; Control Centre</span>
          </div>

          <h1 style={{ fontSize: '1.8rem', color: 'var(--navy-deep)', margin: '0.25rem 0 0.5rem', fontFamily: 'var(--font-serif)' }}>
            Admin Portal Sign In
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0, lineHeight: 1.5 }}>
            Operational telemetry, order governance, developer approvals &amp; financial reconciliation.
          </p>
        </div>

        {error && (
          <div
            style={{
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              color: 'var(--color-danger)',
              padding: '0.9rem 1.15rem',
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
            <div>
              <span>{error}</span>
              {error.includes('Developer Portal') && (
                <div style={{ marginTop: '0.5rem' }}>
                  <button
                    onClick={() => onNavigate('dev-login')}
                    className="btn btn-sm btn-navy"
                    style={{ fontSize: '0.78rem', padding: '0.3rem 0.75rem' }}
                  >
                    Open Developer Portal Sign In &rarr;
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ fontWeight: 600, color: 'var(--navy-deep)', display: 'block', marginBottom: '0.4rem', fontSize: '0.86rem' }}>
              Corporate Administrator Email *
            </label>
            <input
              type="email"
              className="form-control"
              placeholder="e.g. techmastersinnovations@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              style={{ width: '100%', padding: '0.75rem 0.9rem', fontSize: '0.92rem' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label className="form-label" style={{ fontWeight: 600, color: 'var(--navy-deep)', margin: 0, fontSize: '0.86rem' }}>
                Secure Password *
              </label>
            </div>
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
              background: 'linear-gradient(135deg, var(--navy-deep) 0%, var(--navy-primary) 100%)',
              borderColor: 'var(--navy-deep)',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.94rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 14px rgba(13, 27, 42, 0.25)',
            }}
            disabled={loading}
          >
            {loading ? (
              <span>Verifying Administrative Credentials...</span>
            ) : (
              <>
                <KeyRound size={16} style={{ color: 'var(--gold-soft)' }} />
                <span>Sign In to Admin Control Centre</span>
              </>
            )}
          </button>
        </form>

        {/* Security / Audit Policy Warning */}
        <div
          style={{
            marginTop: '1.75rem',
            background: 'var(--bg-champagne)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.85rem 1rem',
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
            lineHeight: 1.5,
            display: 'flex',
            gap: '0.6rem',
            alignItems: 'flex-start',
          }}
        >
          <Lock size={15} style={{ color: 'var(--gold-primary)', flexShrink: 0, marginTop: '2px' }} />
          <span>
            <strong>Authorised Personnel Only:</strong> All access attempts are timestamped and logged in TechMasters central audit records. Unauthorised access attempts are flagged and investigated.
          </span>
        </div>

        {/* Alternate Portals Navigation */}
        <div
          style={{
            marginTop: '2rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            textAlign: 'center',
            fontSize: '0.84rem',
          }}
        >
          <button
            onClick={() => onNavigate('dev-login')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--burgundy-rich)',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
            }}
          >
            <UserCheck size={14} />
            <span>Creative Artisan or Video Producer? Sign in via Developer Portal</span>
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
        </div>
      </div>
    </div>
  );
};

