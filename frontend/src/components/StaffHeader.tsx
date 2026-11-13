import React, { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, ExternalLink, LogOut, ArrowLeft } from 'lucide-react';
import { TechMastersLogo } from './TechMastersLogo';

interface StaffUser {
  full_name?: string;
  email?: string | null;
  is_admin?: boolean;
  can_produce_video?: boolean;
}

interface StaffHeaderProps {
  /** Portal name shown beside the logo, e.g. "Developer Workspace". */
  appName: string;
  /** Signed-in staff user; omit on login pages. */
  user?: StaffUser | null;
  onLogout?: () => void;
  onOpenWebsite: () => void;
}

function roleLabel(u: StaffUser): string {
  if (u.is_admin) return 'Administrator';
  return u.can_produce_video ? 'Developer · Video' : 'Developer';
}

/**
 * Compact top bar for the staff portals (developer and admin), used instead of
 * the public website navigation. The signed-in user's menu sits top-right.
 */
export const StaffHeader: React.FC<StaffHeaderProps> = ({ appName, user, onLogout, onOpenWebsite }) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !e.composedPath().includes(wrapRef.current)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const name = user?.full_name || user?.email || 'Staff';
  const initial = name.charAt(0).toUpperCase();

  return (
    <header className="staff-header">
      <div className="staff-header-brand">
        <TechMastersLogo variant="dark" size="sm" showSubtitle={false} />
        <span className="staff-header-divider" aria-hidden />
        <span className="staff-header-app">{appName}</span>
      </div>

      {user ? (
        <div className="staff-user" ref={wrapRef}>
          <button
            type="button"
            className="staff-user-btn"
            aria-haspopup="menu"
            aria-expanded={open}
            aria-controls={menuId}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="staff-avatar" aria-hidden>{initial}</span>
            <span className="staff-user-text">
              <strong>{name}</strong>
              <span>{roleLabel(user)}</span>
            </span>
            <ChevronDown size={14} aria-hidden />
          </button>
          {open && (
            <div className="staff-menu" role="menu" id={menuId}>
              <div className="staff-menu-head">
                <span className="staff-avatar staff-avatar-lg" aria-hidden>{initial}</span>
                <div>
                  <strong>{name}</strong>
                  {user.email && <span>{user.email}</span>}
                  <span className="staff-menu-role">{roleLabel(user)}</span>
                </div>
              </div>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onOpenWebsite();
                }}
              >
                <ExternalLink size={14} /> View website
              </button>
              {onLogout && (
                <button
                  type="button"
                  role="menuitem"
                  className="staff-menu-logout"
                  onClick={() => {
                    setOpen(false);
                    onLogout();
                  }}
                >
                  <LogOut size={14} /> Log out
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <button type="button" className="staff-header-link" onClick={onOpenWebsite}>
          <ArrowLeft size={14} /> Back to website
        </button>
      )}
    </header>
  );
};
