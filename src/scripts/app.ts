/**
 * Wiring for the generator: every keystroke and option change re-renders the
 * full list of names. There is no generate button by design — the output is a
 * function of the input, so it is always up to date.
 */
import {
	buildBranchName,
	clampLength,
	DEFAULT_LENGTH,
	formatTicket,
	parseInput,
	type BranchName,
	type FormatOptions,
	type ParsedInput,
	type Separator,
} from '../lib/branch-name';
import { BRANCH_TYPES, hueOf, isBranchType, type BranchType } from '../lib/branch-types';
import { must } from './dom';

const COPY_ICON = `<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5.5" y="5.5" width="8" height="8" rx="2"></rect><path d="M10.5 3.2A2 2 0 0 0 8.7 2H4.5a2.5 2.5 0 0 0-2.5 2.5v4.2c0 .8.4 1.5 1.1 1.8"></path></svg>`;
const DONE_ICON = `<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.4 6.4 11.8 13 4.6"></path></svg>`;

const source = must<HTMLTextAreaElement>('#source');
const results = must<HTMLDivElement>('#results');
const empty = must<HTMLDivElement>('#empty');
const hint = must<HTMLSpanElement>('#hint');
const detected = must<HTMLSpanElement>('#detected');
const detectedKey = must<HTMLElement>('#detected-key');
const options = must<HTMLElement>('#options');
const toast = must<HTMLDivElement>('#toast');
const toastLabel = must<HTMLSpanElement>('#toast-label');
const toastDetail = must<HTMLSpanElement>('#toast-detail');

const lowercase = must<HTMLInputElement>('#lowercase');
const lowercaseTicket = must<HTMLInputElement>('#lowercase-ticket');
const includeDate = must<HTMLInputElement>('#include-date');
const maxLength = must<HTMLInputElement>('#max-length');

function readOptions(): FormatOptions {
	const separator = document.querySelector<HTMLInputElement>('input[name="separator"]:checked');
	return {
		separator: (separator?.value === '_' ? '_' : '-') satisfies Separator,
		lowercase: lowercase.checked,
		lowercaseTicket: lowercaseTicket.checked,
		includeDate: includeDate.checked,
		maxLength: clampLength(Number.parseInt(maxLength.value, 10) || DEFAULT_LENGTH),
	};
}

function selectedTypes(): BranchType[] {
	const checked = options.querySelectorAll<HTMLInputElement>('input[name="branch-type"]:checked');
	const picked = new Set([...checked].map((input) => input.value).filter(isBranchType));
	return BRANCH_TYPES.filter((type) => picked.has(type));
}

/** The ticket key is the part people scan for, so it gets its own emphasis. */
function renderName(name: BranchName, parsed: ParsedInput, options: FormatOptions): HTMLSpanElement {
	const el = document.createElement('span');
	el.className = 'name';

	const prefix = document.createElement('span');
	prefix.className = 'pfx';
	prefix.textContent = name.prefix;
	el.append(prefix);

	const key = parsed.ticket ? formatTicket(parsed.ticket, options) : null;
	const at = key ? name.body.indexOf(key) : -1;

	if (key && at >= 0) {
		el.append(
			plain(name.body.slice(0, at)),
			ticket(key),
			plain(name.body.slice(at + key.length)),
		);
	} else {
		el.append(plain(name.body));
	}

	return el;
}

function plain(text: string): HTMLSpanElement {
	const el = document.createElement('span');
	el.className = 'rest';
	el.textContent = text;
	return el;
}

function ticket(text: string): HTMLSpanElement {
	const el = document.createElement('span');
	el.className = 'tkt';
	el.textContent = text;
	return el;
}

function renderRow(
	name: BranchName,
	type: BranchType | null,
	parsed: ParsedInput,
	options: FormatOptions,
): HTMLButtonElement {
	const row = document.createElement('button');
	row.type = 'button';
	row.className = 'row';
	row.style.setProperty('--type-hue', hueOf(type));
	row.dataset.name = name.full;
	row.setAttribute('aria-label', `Copy ${name.full}`);

	const chip = document.createElement('span');
	chip.className = 'chip';
	const dot = document.createElement('span');
	dot.className = 'dot';
	chip.append(dot, type ?? 'no prefix');

	const length = document.createElement('span');
	length.className = name.trimmed ? 'len trimmed' : 'len';
	length.textContent = String(name.full.length);
	length.title = name.trimmed ? 'Trimmed to the maximum length' : 'Characters';

	const copy = document.createElement('span');
	copy.className = 'copy';
	copy.setAttribute('aria-hidden', 'true');
	copy.innerHTML = COPY_ICON;

	row.append(chip, renderName(name, parsed, options), length, copy);
	return row;
}

function render(): void {
	const raw = source.value;
	const opts = readOptions();
	const parsed = parseInput(raw);

	detectedKey.textContent = parsed.ticket ?? '';
	detected.classList.toggle('on', parsed.ticket !== null);

	if (raw.trim() === '') {
		results.replaceChildren();
		empty.hidden = false;
		hint.textContent = 'Click any name to copy';
		return;
	}

	// The unprefixed name always comes first, then one per selected type.
	const types: (BranchType | null)[] = [null, ...selectedTypes()];
	const rows = document.createDocumentFragment();
	let count = 0;

	for (const type of types) {
		const name = buildBranchName(parsed, type, opts);
		if (!name) continue;
		rows.append(renderRow(name, type, parsed, opts));
		count++;
	}

	results.replaceChildren(rows);
	empty.hidden = count > 0;
	hint.textContent = count > 0 ? `${count} name${count > 1 ? 's' : ''} · click to copy` : 'Click any name to copy';
}

/* ── copying ────────────────────────────────────────────────────────── */

let rowTimer = 0;
let toastTimer = 0;

async function writeClipboard(text: string): Promise<void> {
	if (navigator.clipboard?.writeText) {
		await navigator.clipboard.writeText(text);
		return;
	}

	const carrier = document.createElement('textarea');
	carrier.value = text;
	carrier.setAttribute('readonly', '');
	carrier.style.cssText = 'position:fixed;top:0;opacity:0';
	document.body.append(carrier);
	carrier.select();
	const copied = document.execCommand('copy');
	carrier.remove();
	if (!copied) throw new Error('Clipboard unavailable');
}

function showToast(label: string, detail: string, ms: number): void {
	toastLabel.textContent = label;
	toastDetail.textContent = detail;
	toast.classList.add('on');
	window.clearTimeout(toastTimer);
	toastTimer = window.setTimeout(() => toast.classList.remove('on'), ms);
}

function confirmCopy(row: HTMLButtonElement, name: string): void {
	const icon = must<HTMLSpanElement>('.copy', row);
	row.classList.add('copied');
	icon.innerHTML = DONE_ICON;

	window.clearTimeout(rowTimer);
	rowTimer = window.setTimeout(() => {
		row.classList.remove('copied');
		icon.innerHTML = COPY_ICON;
	}, 1400);

	showToast('Copied', name, 1800);
}

results.addEventListener('click', (event) => {
	const row = (event.target as Element).closest<HTMLButtonElement>('.row');
	const name = row?.dataset.name;
	if (!row || !name) return;

	void writeClipboard(name).then(
		() => confirmCopy(row, name),
		() => showToast('Clipboard blocked', 'Select the name and copy it by hand', 2800),
	);
});

/* ── live updates ───────────────────────────────────────────────────── */

source.addEventListener('input', render);
options.addEventListener('input', render);

render();
