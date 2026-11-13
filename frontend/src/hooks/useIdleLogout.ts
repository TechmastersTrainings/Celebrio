import { useCallback, useEffect, useRef, useState } from 'react';

/** Staff sessions end after this much inactivity. */
export const STAFF_IDLE_TIMEOUT_MS = 15 * 60 * 1000;
/** A warning with a countdown is shown this long before logout. */
export const STAFF_IDLE_WARNING_MS = 60 * 1000;

export const LAST_ACTIVITY_KEY = 'celebrio_staff_last_activity';
const STAFF_TOKEN_KEY = 'celebrio_staff_token';
const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keydown', 'wheel', 'scroll', 'touchstart'] as const;
const WRITE_THROTTLE_MS = 5000;
const CHECK_INTERVAL_MS = 1000;

function readLastActivity(): number | null {
  try {
    const v = Number(localStorage.getItem(LAST_ACTIVITY_KEY));
    return Number.isFinite(v) && v > 0 ? v : null;
  } catch {
    return null;
  }
}

export function markStaffActivity(at = Date.now()) {
  try {
    localStorage.setItem(LAST_ACTIVITY_KEY, String(at));
  } catch {
    /* storage unavailable: the in-memory timer still applies */
  }
}

/**
 * Logs a staff user out after a period of inactivity.
 *
 * Activity is shared across tabs through localStorage, so working in one tab
 * keeps the others signed in, and a logout in any tab signs out all of them.
 * Elapsed time is measured against the wall clock, so a laptop that slept
 * past the limit is logged out as soon as it wakes.
 */
export type IdleLogoutReason = 'idle' | 'signed_out_elsewhere';

export function useIdleLogout(enabled: boolean, onTimeout: (reason: IdleLogoutReason) => void) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const lastActivity = useRef(Date.now());
  const lastWrite = useRef(0);
  const warning = useRef(false);
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  const record = useCallback((force = false) => {
    const now = Date.now();
    lastActivity.current = now;
    if (force || now - lastWrite.current > WRITE_THROTTLE_MS) {
      lastWrite.current = now;
      markStaffActivity(now);
    }
  }, []);

  const stayActive = useCallback(() => {
    warning.current = false;
    setSecondsLeft(null);
    record(true);
  }, [record]);

  useEffect(() => {
    if (!enabled) {
      warning.current = false;
      setSecondsLeft(null);
      return;
    }

    // Respect activity recorded before this page load (e.g. a reload after a long absence).
    const stored = readLastActivity();
    if (stored) lastActivity.current = stored;
    else record(true);

    const onActivity = () => {
      // While the warning is showing, only the explicit "Stay signed in" action extends the session.
      if (!warning.current) record();
    };

    const check = () => {
      const shared = readLastActivity();
      if (shared && shared > lastActivity.current) lastActivity.current = shared; // activity in another tab
      const idle = Date.now() - lastActivity.current;
      if (idle >= STAFF_IDLE_TIMEOUT_MS) {
        warning.current = false;
        setSecondsLeft(null);
        onTimeoutRef.current('idle');
      } else if (idle >= STAFF_IDLE_TIMEOUT_MS - STAFF_IDLE_WARNING_MS) {
        warning.current = true;
        setSecondsLeft(Math.ceil((STAFF_IDLE_TIMEOUT_MS - idle) / 1000));
      } else if (warning.current) {
        warning.current = false;
        setSecondsLeft(null);
      }
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key === STAFF_TOKEN_KEY && !e.newValue) onTimeoutRef.current('signed_out_elsewhere'); // logged out in another tab
      else if (e.key === LAST_ACTIVITY_KEY) check();
    };
    const onVisible = () => document.visibilityState === 'visible' && check();

    ACTIVITY_EVENTS.forEach((ev) => window.addEventListener(ev, onActivity, { passive: true }));
    window.addEventListener('storage', onStorage);
    document.addEventListener('visibilitychange', onVisible);
    const timer = window.setInterval(check, CHECK_INTERVAL_MS);
    check();

    return () => {
      ACTIVITY_EVENTS.forEach((ev) => window.removeEventListener(ev, onActivity));
      window.removeEventListener('storage', onStorage);
      document.removeEventListener('visibilitychange', onVisible);
      window.clearInterval(timer);
    };
  }, [enabled, record]);

  return { warningSecondsLeft: secondsLeft, stayActive };
}
