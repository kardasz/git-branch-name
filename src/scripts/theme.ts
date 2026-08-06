import { must } from './dom';

export type ThemeMode = 'system' | 'light' | 'dark';

export const THEME_KEY = 'gbn-theme';

const root = document.documentElement;
const bar = must<HTMLElement>('#theme');

/** Set while we write `data-theme` ourselves, so the observer ignores the echo. */
let applying = false;

function remember(mode: ThemeMode): void {
	try {
		if (mode === 'system') localStorage.removeItem(THEME_KEY);
		else localStorage.setItem(THEME_KEY, mode);
	} catch {
		// Private browsing or blocked storage — the choice just won't persist.
	}
}

function stored(): ThemeMode | null {
	try {
		const value = localStorage.getItem(THEME_KEY);
		return value === 'light' || value === 'dark' ? value : null;
	} catch {
		return null;
	}
}

function mark(mode: ThemeMode): void {
	for (const button of bar.querySelectorAll<HTMLButtonElement>('button[data-mode]')) {
		button.setAttribute('aria-checked', String(button.dataset.mode === mode));
	}
}

/** `system` means no `data-theme` at all, letting `prefers-color-scheme` decide. */
export function setTheme(mode: ThemeMode, persist: boolean): void {
	applying = true;
	if (mode === 'system') delete root.dataset.theme;
	else root.dataset.theme = mode;
	applying = false;

	if (persist) remember(mode);
	mark(mode);
}

bar.addEventListener('click', (event) => {
	const button = (event.target as Element).closest<HTMLButtonElement>('button[data-mode]');
	const mode = button?.dataset.mode;
	if (mode === 'system' || mode === 'light' || mode === 'dark') setTheme(mode, true);
});

// Keep the control honest if the theme is changed from outside this script.
new MutationObserver(() => {
	if (applying) return;
	const current = root.dataset.theme;
	mark(current === 'light' || current === 'dark' ? current : 'system');
}).observe(root, { attributes: true, attributeFilter: ['data-theme'] });

// The inline head script already applied the stored choice; this only syncs the UI.
setTheme(stored() ?? 'system', false);
