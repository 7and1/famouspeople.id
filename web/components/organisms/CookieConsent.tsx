'use client';

import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react';

const CONSENT_KEY = 'fp-cookie-consent';
const CONSENT_DATE_KEY = 'fp-cookie-consent-date';
const CONSENT_OPEN_KEY = 'fp-cookie-consent-open';
const CONSENT_EVENT = 'fp-cookie-consent-changed';
const CONSENT_OPEN_EVENT = 'fp-cookie-consent-opened';

type CookiePreferences = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
};

const DEFAULT_PREFERENCES: CookiePreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
};

function subscribe(callback: () => void) {
  if (typeof window === 'undefined') return () => {};

  const handler = () => callback();
  window.addEventListener('storage', handler);
  window.addEventListener(CONSENT_EVENT, handler as EventListener);
  window.addEventListener(CONSENT_OPEN_EVENT, handler as EventListener);

  return () => {
    window.removeEventListener('storage', handler);
    window.removeEventListener(CONSENT_EVENT, handler as EventListener);
    window.removeEventListener(CONSENT_OPEN_EVENT, handler as EventListener);
  };
}

function getSnapshot(): string {
  if (typeof window === 'undefined') return '{}';
  return JSON.stringify({
    consent: window.localStorage.getItem(CONSENT_KEY),
    open: window.localStorage.getItem(CONSENT_OPEN_KEY),
  });
}

function getServerSnapshot(): string {
  return '{}';
}

function summarizeConsent(prefs: CookiePreferences): 'all' | 'essential' | 'custom' {
  if (prefs.analytics && prefs.marketing) return 'all';
  if (!prefs.analytics && !prefs.marketing) return 'essential';
  return 'custom';
}

function setConsentCookie(prefs: CookiePreferences) {
  const value = summarizeConsent(prefs);
  const maxAge = 60 * 60 * 24 * 365; // 1 year
  document.cookie = `fp_consent=${value}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
}

function parseStoredConsent(raw: string | null): CookiePreferences | null {
  if (!raw) return null;
  if (raw === 'all') return { necessary: true, analytics: true, marketing: true };
  if (raw === 'essential') return { necessary: true, analytics: false, marketing: false };

  try {
    const parsed = JSON.parse(raw) as Partial<CookiePreferences> | null;
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      necessary: true,
      analytics: !!parsed.analytics,
      marketing: !!parsed.marketing,
    };
  } catch {
    return null;
  }
}

function savePreferences(prefs: CookiePreferences) {
  localStorage.setItem(CONSENT_KEY, JSON.stringify(prefs));
  localStorage.setItem(CONSENT_DATE_KEY, new Date().toISOString());
  localStorage.removeItem(CONSENT_OPEN_KEY);
  setConsentCookie(prefs);
  window.dispatchEvent(new Event(CONSENT_EVENT));
}

export function CookieConsent() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const { consent, open } = (() => {
    try {
      return JSON.parse(snapshot) as { consent: string | null; open: string | null };
    } catch {
      return { consent: null, open: null };
    }
  })();

  const storedPreferences = useMemo(() => parseStoredConsent(consent), [consent]);
  const isOpen = !!open;
  const modalKey = open || 'closed';

  const analyticsRef = useRef<HTMLInputElement | null>(null);
  const marketingRef = useRef<HTMLInputElement | null>(null);

  const openCustomize = () => {
    localStorage.setItem(CONSENT_OPEN_KEY, String(Date.now()));
    window.dispatchEvent(new Event(CONSENT_OPEN_EVENT));
  };

  const closeCustomize = () => {
    localStorage.removeItem(CONSENT_OPEN_KEY);
    window.dispatchEvent(new Event(CONSENT_OPEN_EVENT));
  };

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeCustomize();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  const acceptAll = () => {
    savePreferences({ necessary: true, analytics: true, marketing: true });
  };

  const rejectAll = () => {
    savePreferences({ necessary: true, analytics: false, marketing: false });
  };

  const saveCustom = () => {
    savePreferences({
      necessary: true,
      analytics: analyticsRef.current?.checked ?? false,
      marketing: marketingRef.current?.checked ?? false,
    });
  };

  // No choice yet -> show banner (until user accepts/rejects/customizes).
  if (!storedPreferences && !isOpen) {
    return (
      <div
        id="cookie-consent-dialog"
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-surface-border bg-white/95 p-4 shadow-lg backdrop-blur"
        role="dialog"
        aria-label="Cookie consent"
        aria-modal="true"
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <p className="text-sm text-text-secondary">
              We use necessary cookies to make this site work. Optional cookies help us measure and improve performance.
              You can change your choice any time. See our <a className="text-brand-700 hover:underline" href="/privacy">Privacy Policy</a>.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={openCustomize}
              className="rounded-lg border border-surface-border px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-muted"
            >
              Customize
            </button>
            <button
              type="button"
              onClick={rejectAll}
              className="rounded-lg border border-surface-border px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-muted"
            >
              Reject All
            </button>
            <button
              type="button"
              onClick={acceptAll}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Preferences already saved, and not explicitly opened -> render nothing.
  if (!isOpen) return null;

  // Customize modal (opened via footer link or "Customize" button).
  const initial = storedPreferences || DEFAULT_PREFERENCES;
  return (
    <div
      key={modalKey}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) closeCustomize();
      }}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-surface-border bg-white shadow-xl"
        role="dialog"
        aria-label="Cookie preferences"
        aria-modal="true"
      >
        <div className="p-6">
          <h2 className="text-lg font-semibold text-text-primary">Cookie Preferences</h2>
          <p className="mt-2 text-sm text-text-secondary">
            Choose which optional cookies you want to allow. Necessary cookies are always on because they are required for the website to function.
          </p>

          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-surface-border p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">Necessary cookies</h3>
                  <p className="mt-1 text-xs text-text-secondary">Always active for core functionality and security.</p>
                </div>
                <span className="text-xs font-medium text-text-tertiary">Always active</span>
              </div>
            </div>

            <div className="rounded-xl border border-surface-border p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-text-primary">Analytics cookies</h3>
                  <p className="mt-1 text-xs text-text-secondary">Help us understand usage so we can improve speed and content.</p>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input ref={analyticsRef} type="checkbox" defaultChecked={initial.analytics} />
                  <span className="text-xs text-text-secondary">Allow</span>
                </label>
              </div>
            </div>

            <div className="rounded-xl border border-surface-border p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-text-primary">Marketing cookies</h3>
                  <p className="mt-1 text-xs text-text-secondary">Used for advertising and cross-site tracking (off by default).</p>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input ref={marketingRef} type="checkbox" defaultChecked={initial.marketing} />
                  <span className="text-xs text-text-secondary">Allow</span>
                </label>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closeCustomize}
              className="rounded-lg border border-surface-border px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveCustom}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
            >
              Save preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
