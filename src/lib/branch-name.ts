import type { BranchType } from './branch-types';

export type Separator = '-' | '_';

export interface FormatOptions {
	separator: Separator;
	/** Lowercases the title. The ticket key is governed separately. */
	lowercase: boolean;
	/** Off by default: `JIRA-123` is an identifier, so its case is preserved. */
	lowercaseTicket: boolean;
	includeDate: boolean;
	/** Character budget for the whole name, prefix included. */
	maxLength: number;
}

export interface ParsedInput {
	/** Ticket key such as `JIRA-123123`, always upper-cased. */
	ticket: string | null;
	/** Whatever is left once the ticket and any URL are removed. */
	title: string;
}

export interface BranchName {
	/** `feature/`, or an empty string for the unprefixed name. */
	prefix: string;
	body: string;
	full: string;
	/** True when the name had to be cut back to fit `maxLength`. */
	trimmed: boolean;
}

export const MIN_LENGTH = 12;
export const MAX_LENGTH = 200;
export const DEFAULT_LENGTH = 60;

/** `ABC-123`, `ABC_123` or `ABC 123` — the shapes people paste in practice. */
const TICKET = /\b([A-Z][A-Z0-9]{1,9})[-_ ]?(\d{1,7})\b/i;
const URL = /https?:\/\/\S+/i;
const COMBINING_MARKS = /[\u0300-\u036f]/g;

/** Strip accents so `Zmień hasło` slugs to `zmien-haslo`, not `zmie-haso`. */
function deburr(text: string): string {
	return text
		.replace(/ł/g, 'l')
		.replace(/Ł/g, 'L')
		.normalize('NFD')
		.replace(COMBINING_MARKS, '');
}

/**
 * Pull the ticket key out of a JIRA link or raw text and keep the rest as the
 * title. A key inside a URL wins — that is the one the person actually linked.
 */
export function parseInput(raw: string): ParsedInput {
	let text = raw.trim();
	let ticket: string | null = null;

	const url = text.match(URL);
	if (url) {
		const inUrl = url[0].match(TICKET);
		if (inUrl) ticket = `${inUrl[1]}-${inUrl[2]}`.toUpperCase();
		text = text.replace(url[0], ' ');
	}

	if (!ticket) {
		const inText = text.match(TICKET);
		if (inText) {
			ticket = `${inText[1]}-${inText[2]}`.toUpperCase();
			text = text.replace(inText[0], ' ');
		}
	}

	return { ticket, title: text.replace(/\s+/g, ' ').trim() };
}

/** Reduce free text to characters that are legal — and readable — in a git ref. */
export function slugify(text: string, separator: Separator): string {
	const sep = escapeForClass(separator);
	return deburr(text)
		.replace(/['’`"]/g, '')
		.replace(/[^a-zA-Z0-9]+/g, separator)
		.replace(new RegExp(`${sep}{2,}`, 'g'), separator)
		.replace(new RegExp(`^${sep}|${sep}$`, 'g'), '');
}

function escapeForClass(separator: Separator): string {
	return separator === '-' ? '\\-' : separator;
}

/**
 * The ticket key as it appears in the branch name.
 *
 * It keeps its own hyphen even under the `_` separator, and its case is left
 * alone unless asked otherwise — JIRA matches branches on `ABC-7`, so both
 * `ABC_7` and a surprise lowercase would weaken that link.
 */
export function formatTicket(ticket: string, options: Pick<FormatOptions, 'lowercaseTicket'>): string {
	return options.lowercaseTicket ? ticket.toLowerCase() : ticket;
}

export function formatDate(date: Date): string {
	const pad = (n: number): string => String(n).padStart(2, '0');
	return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
}

/**
 * Assemble one branch name. Returns `null` when there is nothing to build from
 * — an input of only whitespace or punctuation.
 */
export function buildBranchName(
	parsed: ParsedInput,
	type: BranchType | null,
	options: FormatOptions,
	today: Date = new Date(),
): BranchName | null {
	const { separator, lowercase, includeDate } = options;
	const maxLength = clampLength(options.maxLength);

	const parts: string[] = [];
	if (includeDate) parts.push(formatDate(today));
	if (parsed.ticket) parts.push(formatTicket(parsed.ticket, options));

	const title = slugify(parsed.title, separator);
	if (title) parts.push(lowercase ? title.toLowerCase() : title);

	if (parts.length === 0) return null;

	const prefix = type ? `${type}/` : '';
	let body = parts.join(separator);
	let trimmed = false;

	if (prefix.length + body.length > maxLength) {
		const room = Math.max(4, maxLength - prefix.length);
		let cut = body.slice(0, room);

		// Prefer a word boundary over a hard cut, but only if it keeps most of it.
		const boundary = cut.lastIndexOf(separator);
		if (boundary > room * 0.55) cut = cut.slice(0, boundary);

		body = cut.replace(new RegExp(`${escapeForClass(separator)}+$`), '');
		trimmed = true;
	}

	return { prefix, body, full: prefix + body, trimmed };
}

export function clampLength(value: number): number {
	if (!Number.isFinite(value)) return DEFAULT_LENGTH;
	return Math.min(MAX_LENGTH, Math.max(MIN_LENGTH, Math.round(value)));
}
