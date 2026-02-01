'use client';

const CONSENT_OPEN_KEY = 'fp-cookie-consent-open';
const CONSENT_OPEN_EVENT = 'fp-cookie-consent-opened';

export function CookiePreferencesLink() {
  return (
    <button
      type="button"
      className="hover:text-brand-700"
      aria-haspopup="dialog"
      aria-controls="cookie-consent-dialog"
      onClick={() => {
        try {
          localStorage.setItem(CONSENT_OPEN_KEY, String(Date.now()));
          window.dispatchEvent(new Event(CONSENT_OPEN_EVENT));
        } catch {
          // Ignore storage failures (private mode / blocked)
        }
      }}
    >
      Cookie Preferences
    </button>
  );
}
