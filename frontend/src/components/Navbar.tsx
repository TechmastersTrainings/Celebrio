import React, { useState } from 'react';
import { TechMastersLogo } from './TechMastersLogo';
import { Menu, X, Sparkles, Search, Compass, PhoneCall, LogIn, LayoutDashboard, Code } from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, param?: string) => void;
  staffUser: any | null;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, staffUser, onLogout }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (view: string, hash?: string) => {
    setMobileMenuOpen(false);
    if (view === 'home' && hash) {
      if (currentView !== 'home') {
        onNavigate('home');
        setTimeout(() => {
          const el = document.getElementById(hash);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      } else {
        const el = document.getElementById(hash);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }
    onNavigate(view);
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Brand Logo: Official TechMasters Innovations identity */}
        <a
          href="#home"
          style={{ textDecoration: 'none' }}
          onClick={(e) => {
            e.preventDefault();
            handleNavClick('home');
          }}
        >
          <TechMastersLogo variant="header" size="md" />
        </a>

        {/* Desktop Navigation Links */}
        <nav className="nav-links desktop-only">
          <button
            className={`nav-link ${currentView === 'home' ? 'active' : ''}`}
            onClick={() => handleNavClick('home')}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Home
          </button>

          <button
            className={`nav-link ${currentView === 'designs' ? 'active' : ''}`}
            onClick={() => handleNavClick('designs')}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Invitation Designs
          </button>

          <button
            className={`nav-link ${currentView === 'catalog' ? 'active' : ''}`}
            onClick={() => handleNavClick('catalog')}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Packages &amp; Pricing
          </button>

          <button
            className={`nav-link ${currentView === 'tracking' ? 'active' : ''}`}
            onClick={() => handleNavClick('tracking')}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Track Order
          </button>
        </nav>

        {/* Action CTAs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Track Order */}
          <button
            className={`btn btn-sm ${currentView === 'tracking' ? 'btn-navy' : 'btn-outline'}`}
            onClick={() => handleNavClick('tracking')}
            style={{ display: 'none', '@media (min-width: 768px)': { display: 'inline-flex' } } as any}
          >
            <Search size={14} />
            <span className="desktop-only">Track Order</span>
          </button>

          {/* Primary CTA: Create Invitation */}
          <button
            className="btn btn-primary btn-sm"
            onClick={() => handleNavClick('wizard')}
          >
            <Sparkles size={15} style={{ color: '#F59E0B' }} />
            <span>Create Invitation</span>
          </button>

          {/* Staff Portals / Workspace (Visible only when logged in) */}
          {staffUser && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {staffUser.is_admin && (
                <button
                  className={`btn btn-sm ${currentView === 'admin' ? 'btn-primary' : 'btn-navy'}`}
                  onClick={() => handleNavClick('admin')}
                  title="Admin Superman Command Center"
                >
                  <LayoutDashboard size={14} />
                  <span className="desktop-only">Admin Portal</span>
                </button>
              )}
              <button
                className={`btn btn-sm ${currentView === 'workspace' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => handleNavClick('workspace')}
                title="Developer Workspace & Studio"
              >
                <Code size={14} />
                <span className="desktop-only">Developer Portal</span>
              </button>
              <button
                className="btn btn-outline btn-sm"
                onClick={onLogout}
                style={{ padding: '0.45rem 0.7rem' }}
                title="Sign out of staff account"
              >
                Exit
              </button>
            </div>
          )}

          {/* Mobile hamburger button */}
          <button
            className="mobile-nav-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div
          style={{
            background: 'var(--bg-ivory)',
            borderTop: '1px solid var(--border-subtle)',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
          }}
        >
          <button
            className={`nav-link ${currentView === 'home' ? 'active' : ''}`}
            onClick={() => handleNavClick('home')}
            style={{ textAlign: 'left', padding: '0.6rem 0', background: 'none', border: 'none', fontSize: '1rem' }}
          >
            Home
          </button>
          <button
            className={`nav-link ${currentView === 'designs' ? 'active' : ''}`}
            onClick={() => handleNavClick('designs')}
            style={{ textAlign: 'left', padding: '0.6rem 0', background: 'none', border: 'none', fontSize: '1rem' }}
          >
            Invitation Designs Gallery
          </button>
          <button
            className={`nav-link ${currentView === 'catalog' ? 'active' : ''}`}
            onClick={() => handleNavClick('catalog')}
            style={{ textAlign: 'left', padding: '0.6rem 0', background: 'none', border: 'none', fontSize: '1rem' }}
          >
            Packages &amp; Pricing
          </button>

          <hr style={{ borderColor: 'var(--border-subtle)', margin: '0.5rem 0' }} />

          <button
            className="btn btn-navy btn-sm"
            onClick={() => handleNavClick('tracking')}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <Search size={14} />
            Track Order with Mobile OTP
          </button>

          {staffUser && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {staffUser.is_admin && (
                <button
                  className="btn btn-navy btn-sm"
                  onClick={() => handleNavClick('admin')}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <LayoutDashboard size={14} /> Admin Superman Control Center
                </button>
              )}
              <button
                className="btn btn-primary btn-sm"
                onClick={() => handleNavClick('workspace')}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <Code size={14} /> Developer Studio Workspace
              </button>
              <button
                className="btn btn-outline btn-sm"
                onClick={onLogout}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
