import { must } from './dom';

const MEASUREMENT_ID = 'G-CTBPCXYPXK';
const STORAGE_KEY = 'gbn-cookie-consent';
const CONSENT_VERSION = 1;
const LIFETIME = 180 * 24 * 60 * 60 * 1000;
type Consent = { version: number; analytics: boolean; savedAt: number };

declare global {
	interface Window {
		dataLayer?: IArguments[];
		gtag?: (...args: unknown[]) => void;
		'ga-disable-G-CTBPCXYPXK'?: boolean;
	}
}

const banner = must<HTMLElement>('#cookie-banner');
const close = must<HTMLButtonElement>('#cookie-close');
const status = must<HTMLElement>('#cookie-status');
const settings = document.querySelectorAll<HTMLButtonElement>('[data-cookie-settings]');
let memoryConsent: Consent | null = null;
let memoryOnly = false;
let started = false;
let enabled = false;
let expiryTimer = 0;
let returnFocus: HTMLElement | null = null;

function valid(value: unknown): value is Consent {
	if (!value || typeof value !== 'object') return false;
	const c = value as Partial<Consent>;
	return c.version === CONSENT_VERSION && typeof c.analytics === 'boolean'
		&& typeof c.savedAt === 'number' && Number.isFinite(c.savedAt)
		&& c.savedAt <= Date.now() && Date.now() - c.savedAt < LIFETIME;
}

function readConsent(): Consent | null {
	if (memoryOnly) return valid(memoryConsent) ? memoryConsent : null;
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		const value: unknown = raw ? JSON.parse(raw) : null;
		return valid(value) ? value : null;
	} catch {
		// If storage is blocked, an explicit choice applies only in this document.
		return valid(memoryConsent) ? memoryConsent : null;
	}
}

function clearAnalyticsCookies(): void {
	const domains = location.hostname.split('.').map((_, i, parts) => parts.slice(i).join('.'));
	for (const cookie of document.cookie.split(';')) {
		const name = cookie.split('=')[0].trim();
		if (name !== '_ga' && !name.startsWith('_ga_')) continue;
		const expired = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
		document.cookie = expired;
		// Also remove cookies from earlier configurations using an automatic domain.
		for (const domain of domains) document.cookie = `${expired}; Domain=${domain}`;
	}
}

function setAnalytics(allow: boolean): void {
	window['ga-disable-G-CTBPCXYPXK'] = !allow;
	if (!allow) {
		// The opt-out flag is set before updating consent, including pending tag loads.
		if (enabled) window.gtag?.('consent', 'update', { analytics_storage: 'denied' });
		enabled = false;
		clearAnalyticsCookies();
		return;
	}
	if (enabled) return;
	window.dataLayer = window.dataLayer || [];
	window.gtag = window.gtag || function () { window.dataLayer!.push(arguments); };
	if (!started) {
		window.gtag('consent', 'default', {
			analytics_storage: 'denied', ad_storage: 'denied',
			ad_user_data: 'denied', ad_personalization: 'denied',
		});
	}
	window.gtag('consent', 'update', { analytics_storage: 'granted' });
	if (!started) {
		window.gtag('js', new Date());
		window.gtag('config', MEASUREMENT_ID, {
			allow_google_signals: false,
			allow_ad_personalization_signals: false,
			cookie_domain: 'none',
			cookie_expires: LIFETIME / 1000,
			cookie_update: false,
			// Never put URL query strings, fragments or referrer details into analytics.
			page_location: location.origin + location.pathname,
			page_referrer: '',
		});
		const script = document.createElement('script');
		script.async = true;
		script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
		document.head.append(script);
		started = true;
	}
	enabled = true;
}

function sync(): void {
	const consent = readConsent();
	setAnalytics(consent?.analytics === true);
	banner.hidden = consent !== null;
	close.hidden = consent === null;
	window.clearTimeout(expiryTimer);
	if (consent) {
		// Browser timers cap at about 24 days; recheck until the actual expiry.
		expiryTimer = window.setTimeout(sync, Math.min(consent.savedAt + LIFETIME - Date.now(), 2_147_483_647));
	}
}

function hideBanner(): void {
	const needsFocus = banner.contains(document.activeElement);
	banner.hidden = true;
	if (needsFocus) (returnFocus ?? settings[0])?.focus({ preventScroll: true });
}

function choose(analytics: boolean): void {
	memoryConsent = { version: CONSENT_VERSION, analytics, savedAt: Date.now() };
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryConsent));
		memoryOnly = false;
	} catch {
		memoryOnly = true; // A stale stored acceptance must not override a new rejection.
		try { localStorage.removeItem(STORAGE_KEY); } catch { /* Storage is unavailable. */ }
	}
	// Apply the explicit choice even when reads succeed but writes are blocked.
	setAnalytics(analytics);
	window.clearTimeout(expiryTimer);
	expiryTimer = window.setTimeout(sync, Math.min(LIFETIME, 2_147_483_647));
	hideBanner();
	close.hidden = false;
	status.textContent = analytics ? 'Analytics accepted.' : 'Analytics rejected. Analytics cookies removed.';
}

must<HTMLButtonElement>('#cookie-accept').addEventListener('click', () => choose(true));
must<HTMLButtonElement>('#cookie-reject').addEventListener('click', () => choose(false));
close.addEventListener('click', hideBanner);
banner.addEventListener('keydown', (event) => {
	if (event.key === 'Escape') hideBanner(); // Dismissal never grants consent.
});
for (const button of settings) {
	button.hidden = false;
	button.addEventListener('click', () => {
		returnFocus = button;
		banner.hidden = false;
		close.hidden = false;
		must<HTMLElement>('#cookie-title').focus();
	});
}
window.addEventListener('storage', (event) => {
	if (event.key === STORAGE_KEY || event.key === null) {
		memoryConsent = null;
		memoryOnly = false;
		sync();
	}
});
window.addEventListener('pageshow', sync);
window.addEventListener('focus', sync);
sync();
