import React from 'react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, param?: string) => void;
  staffUser: any | null;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, staffUser, onLogout }) => {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <a
            href="#home"
            className="navbar-brand"
            onClick={(e) => { e.preventDefault(); onNavigate('catalog'); }}
          >
            <span style={{ fontSize: '1.6rem' }}>✨</span>
            <div>
              <div style={{ fontSize: '1.15rem', lineHeight: 1.1 }}>TechMasters</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-accent-dark)', letterSpacing: '1px', textTransform: 'uppercase' }}>
                Digital Celebrations
              </div>
            </div>
          </a>
        </div>

        <nav className="nav-links">
          <button
            className={`btn btn-sm ${currentView === 'catalog' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => onNavigate('catalog')}
          >
            Packages & Pricing
          </button>

          <button
            className={`btn btn-sm ${currentView === 'wizard' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => onNavigate('wizard')}
          >
            Create Invitation
          </button>

          <button
            className={`btn btn-sm ${currentView === 'tracking' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => onNavigate('tracking')}
          >
            Track Order / OTP
          </button>

          <div style={{ width: '1px', height: '24px', background: 'var(--color-border)', margin: '0 0.5rem' }} />

          {staffUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {staffUser.is_admin ? (
                <button
                  className={`btn btn-sm ${currentView === 'admin' ? 'btn-gold' : 'btn-outline'}`}
                  onClick={() => onNavigate('admin')}
                >
                  Admin Center
                </button>
              ) : null}

              <button
                className={`btn btn-sm ${currentView === 'workspace' ? 'btn-gold' : 'btn-outline'}`}
                onClick={() => onNavigate('workspace')}
              >
                Dev Workspace
              </button>

              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {staffUser.full_name}
              </div>

              <button
                className="btn btn-sm btn-outline"
                style={{ color: 'var(--color-danger)', borderColor: '#FECDD3' }}
                onClick={onLogout}
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              className={`btn btn-sm ${currentView === 'dev-auth' ? 'btn-gold' : 'btn-outline'}`}
              onClick={() => onNavigate('dev-auth')}
            >
              Staff / Dev Login
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};

