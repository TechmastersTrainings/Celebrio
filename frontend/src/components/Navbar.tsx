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
            onClick={(e) => { e.preventDefault(); onNavigate('home'); }}
          >
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #7B2CBF 0%, #D4AF37 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(212, 175, 55, 0.35)',
              fontSize: '1.25rem'
            }}>
              ✨
            </div>
            <div>
              <div style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.2rem',
                fontWeight: 800,
                letterSpacing: '0.5px',
                background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 50%, #D4AF37 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                lineHeight: 1.15
              }}>
                TechMasters
              </div>
              <div style={{
                fontSize: '0.68rem',
                color: '#D4AF37',
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                fontWeight: 700
              }}>
                Digital Celebrations
              </div>
            </div>
          </a>
        </div>

        <nav className="nav-links">
          <button
            className={`btn btn-sm ${currentView === 'home' ? 'btn-gold' : 'btn-outline'}`}
            onClick={() => onNavigate('home')}
          >
            Home
          </button>

          <button
            className={`btn btn-sm ${currentView === 'catalog' ? 'btn-gold' : 'btn-outline'}`}
            onClick={() => onNavigate('catalog')}
          >
            Packages & Pricing
          </button>

          <button
            className={`btn btn-sm ${currentView === 'wizard' ? 'btn-gold' : 'btn-outline'}`}
            onClick={() => onNavigate('wizard')}
            style={currentView !== 'wizard' ? { borderColor: 'rgba(212, 175, 55, 0.4)', color: '#FBE698' } : {}}
          >
            ✨ Create Invitation
          </button>

          <button
            className={`btn btn-sm ${currentView === 'tracking' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => onNavigate('tracking')}
          >
            Track Order / OTP
          </button>

          <div style={{ width: '1px', height: '24px', background: 'rgba(226, 232, 240, 0.2)', margin: '0 0.35rem' }} />

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
                className={`btn btn-sm ${currentView === 'workspace' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => onNavigate('workspace')}
              >
                Dev Workspace
              </button>

              <div style={{ fontSize: '0.8rem', color: 'var(--silver-muted)', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {staffUser.full_name}
              </div>

              <button
                className="btn btn-sm btn-outline"
                style={{ color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                onClick={onLogout}
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              className={`btn btn-sm ${currentView === 'dev-auth' ? 'btn-primary' : 'btn-outline'}`}
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
