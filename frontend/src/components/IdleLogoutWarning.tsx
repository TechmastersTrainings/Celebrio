import React, { useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';

interface Props {
  secondsLeft: number;
  onStay: () => void;
  onLogout: () => void;
}

/** Countdown shown shortly before an idle staff session is signed out. */
export const IdleLogoutWarning: React.FC<Props> = ({ secondsLeft, onStay, onLogout }) => {
  const stayRef = useRef<HTMLButtonElement>(null);
  useEffect(() => stayRef.current?.focus(), []);

  const m = Math.floor(secondsLeft / 60);
  const s = String(secondsLeft % 60).padStart(2, '0');

  return (
    <div className="idle-backdrop">
      <div className="idle-dialog" role="alertdialog" aria-modal="true" aria-labelledby="idle-title" aria-describedby="idle-desc">
        <Clock size={22} aria-hidden />
        <h2 id="idle-title">Are you still there?</h2>
        <p id="idle-desc">
          For security, you'll be signed out in <strong aria-live="polite">{m}:{s}</strong> because there has been no activity.
        </p>
        <div className="idle-actions">
          <button type="button" className="idle-btn" onClick={onLogout}>Log out now</button>
          <button type="button" className="idle-btn idle-btn-primary" ref={stayRef} onClick={onStay}>Stay signed in</button>
        </div>
      </div>
    </div>
  );
};
