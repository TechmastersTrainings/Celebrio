import React, { useState } from 'react';
import { TechMastersLogo } from './TechMastersLogo';
import { Menu, X, Sparkles, Search, LogOut, LayoutDashboard, Code } from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, param?: string) => void;
  staffUser: any | null;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, staffUser, onLogout }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Strict Admin Check: Only techmastersinnovations@gmail.com has Admin access
  const isActualAdmin = Boolean(
    staffUser &&
    staffUser.email?.toLowerCase() === 'techmastersinnovations@gmail.com'
  );

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {/* Track Order */}
          <button
            className={`btn btn-sm nav-track-btn ${currentView === 'tracking' ? 'btn-navy' : 'btn-outline'}`}
            onClick={() => handleNavClick('tracking')}
          >
            <Search size={14} />
            <span>Track Order</span>
          </button>

          {/* Primary CTA: Create Invitation */}
          <button
            className="btn btn-primary btn-sm"
            onClick={() => handleNavClick('wizard')}
          >
            <Sparkles size={15} style={{ color: '#F59E0B' }} />
            <span>Create Invitation</span>
          </button>

          {/* Admin Portal Button: ONLY visible for techmastersinnovations@gmail.com and when not already on admin */}
          {isActualAdmin && currentView !== 'admin' && (
            <button
              className="btn btn-navy btn-sm"
              onClick={() => handleNavClick('admin')}
              title="Admin Control Center"
            >
              <LayoutDashboard size={14} />
              <span className="desktop-only">Admin Portal</span>
            </button>
          )}

          {/* Developer Workspace Button: Only visible when browsing customer pages */}
          {staffUser && !isActualAdmin && currentView !== 'workspace' && (
            <button
              className="btn btn-navy btn-sm"
              onClick={() => handleNavClick('workspace')}
              title="Developer Workspace"
            >
              <Code size={14} />
              <span className="desktop-only">Developer Workspace</span>
            </button>
          )}

          {/* Clean Logout Button for all logged in staff */}
          {staffUser && (
            <button
              className="btn btn-outline btn-sm"
              onClick={onLogout}
              style={{ padding: '0.45rem 0.75rem', gap: '0.35rem' }}
              title="Sign out of account"
            >
              <LogOut size={13} />
              <span>Logout</span>
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
            style={{ textAlign: 'left', background: 'none', border: 'none', padding: '0.4rem 0' }}
          >
            Home
          </button>

          <button
            className={`nav-link ${currentView === 'designs' ? 'active' : ''}`}
            onClick={() => handleNavClick('designs')}
            style={{ textAlign: 'left', background: 'none', border: 'none', padding: '0.4rem 0' }}
          >
            Invitation Designs
          </button>

          <button
            className={`nav-link ${currentView === 'catalog' ? 'active' : ''}`}
            onClick={() => handleNavClick('catalog')}
            style={{ textAlign: 'left', background: 'none', border: 'none', padding: '0.4rem 0' }}
          >
            Packages &amp; Pricing
          </button>

          <button
            className={`nav-link ${currentView === 'tracking' ? 'active' : ''}`}
            onClick={() => handleNavClick('tracking')}
            style={{ textAlign: 'left', background: 'none', border: 'none', padding: '0.4rem 0' }}
          >
            Track Order
          </button>

          {isActualAdmin && (
            <button
              className="btn btn-navy btn-sm"
              onClick={() => handleNavClick('admin')}
              style={{ justifyContent: 'center', marginTop: '0.5rem' }}
            >
              <LayoutDashboard size={14} /> Admin Portal
            </button>
          )}

          {staffUser && !isActualAdmin && currentView !== 'workspace' && (
            <button
              className="btn btn-navy btn-sm"
              onClick={() => handleNavClick('workspace')}
              style={{ justifyContent: 'center', marginTop: '0.5rem' }}
            >
              <Code size={14} /> Developer Workspace
            </button>
          )}

          {staffUser && (
            <button
              className="btn btn-outline btn-sm"
              onClick={() => {
                setMobileMenuOpen(false);
                onLogout();
              }}
              style={{ justifyContent: 'center', gap: '0.4rem', color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
            >
              <LogOut size={14} /> Logout
            </button>
          )}
        </div>
      )}
    </header>
  );
};
