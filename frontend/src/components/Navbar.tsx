import React, { useState } from 'react';
import { TechMastersLogo } from './TechMastersLogo';
import { Menu, X, Sparkles, Search, Compass, PhoneCall, LogIn, LayoutDashboard } from 'lucide-react';

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
            className="nav-link"
            onClick={() => handleNavClick('home', 'services')}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Services
          </button>

          <button
            className="nav-link"
            onClick={() => handleNavClick('home', 'how-it-works')}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            How It Works
          </button>

          <button
            className={`nav-link ${currentView === 'catalog' ? 'active' : ''}`}
            onClick={() => handleNavClick('catalog')}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Packages &amp; Pricing
          </button>

          <button
            className="nav-link"
            onClick={() => handleNavClick('home', 'contact')}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Contact
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

          {/* Staff Login / Workspace */}
          {staffUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                className="btn btn-navy btn-sm"
                onClick={() => handleNavClick(staffUser.is_admin ? 'admin' : 'workspace')}
                title={`Logged in as ${staffUser.full_name || staffUser.email}`}
              >
                <LayoutDashboard size={14} />
                <span className="desktop-only">
                  {staffUser.is_admin ? 'Admin Center' : 'Workspace'}
                </span>
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
          ) : (
            <button
              className="btn btn-outline btn-sm desktop-only"
              onClick={() => handleNavClick('dev-auth')}
            >
              <LogIn size={14} />
              <span>Staff Login</span>
            </button>
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
            className="nav-link"
            onClick={() => handleNavClick('home', 'services')}
            style={{ textAlign: 'left', padding: '0.6rem 0', background: 'none', border: 'none', fontSize: '1rem' }}
          >
            Services &amp; Offerings
          </button>
          <button
            className="nav-link"
            onClick={() => handleNavClick('home', 'how-it-works')}
            style={{ textAlign: 'left', padding: '0.6rem 0', background: 'none', border: 'none', fontSize: '1rem' }}
          >
            How It Works (Process)
          </button>
          <button
            className={`nav-link ${currentView === 'catalog' ? 'active' : ''}`}
            onClick={() => handleNavClick('catalog')}
            style={{ textAlign: 'left', padding: '0.6rem 0', background: 'none', border: 'none', fontSize: '1rem' }}
          >
            Packages &amp; Pricing
          </button>
          <button
            className="nav-link"
            onClick={() => handleNavClick('home', 'contact')}
            style={{ textAlign: 'left', padding: '0.6rem 0', background: 'none', border: 'none', fontSize: '1rem' }}
          >
            Contact &amp; Location (Bidar)
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

          {!staffUser && (
            <button
              className="btn btn-outline btn-sm"
              onClick={() => handleNavClick('dev-auth')}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <LogIn size={14} />
              Internal Staff &amp; Developer Sign In
            </button>
          )}
        </div>
      )}
    </header>
  );
};
