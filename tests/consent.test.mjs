import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

// Run the actual browser entry point with controlled storage, clock and DOM.
// No Google requests are made by these tests.
const source = stripTypeScriptTypes(readFileSync(new URL('../src/scripts/consent.ts', import.meta.url), 'utf8'))
	.replace("import { must } from './dom';", '');
const KEY = 'gbn-cookie-consent';
const AGE = 180 * 24 * 60 * 60 * 1000;
const NOW = 1_790_900_000_000;
const saved = (analytics, savedAt = NOW) => JSON.stringify({ version: 1, analytics, savedAt });

function setup({ stored = null, blocked = false, writesBlocked = false } = {}) {
	let now = NOW;
	const values = new Map(stored === null ? [] : [[KEY, stored]]);
	const scripts = [];
	const timers = new Map();
	const events = new Map();
	const nodes = new Map();
	const cookieJar = new Map();
	const cookieWrites = [];
	let timerId = 0;
	const element = (id) => {
		const listeners = new Map();
		return { id, hidden: true, textContent: '', listeners,
			addEventListener: (name, fn) => listeners.set(name, fn),
			contains: (node) => node?.id?.startsWith('#cookie-'),
			focus() { document.activeElement = this; },
		};
	};
	const settings = element('settings');
	for (const id of ['banner', 'title', 'close', 'status', 'accept', 'reject']) nodes.set(`#cookie-${id}`, element(`#cookie-${id}`));
	const document = {
		activeElement: null,
		querySelectorAll: () => [settings],
		createElement: () => ({}),
		head: { append: (script) => scripts.push(script) },
		get cookie() { return [...cookieJar].map(([key, value]) => `${key}=${value}`).join('; '); },
		set cookie(value) {
			cookieWrites.push(value);
			if (value.includes('Max-Age=0')) cookieJar.delete(value.split('=')[0]);
		},
	};
	const window = {
		addEventListener: (name, fn) => events.set(name, fn),
		setTimeout: (fn, delay) => { timers.set(++timerId, { fn, delay }); return timerId; },
		clearTimeout: (id) => timers.delete(id),
	};
	const localStorage = {
		getItem(key) { if (blocked) throw Error('Storage blocked'); return values.get(key) ?? null; },
		setItem(key, value) { if (blocked || writesBlocked) throw Error('Storage blocked'); values.set(key, value); },
		removeItem(key) { if (blocked) throw Error('Storage blocked'); values.delete(key); },
	};
	runInNewContext(source, {
		window, document, localStorage,
		location: { hostname: 'gitbranch.name', origin: 'https://gitbranch.name', pathname: '/', search: '?private=ticket', hash: '#secret' },
		Date: class extends Date { static now() { return now; } },
		must: (selector) => { assert.ok(nodes.has(selector)); return nodes.get(selector); },
	});
	return { window, nodes, scripts, values, timers, events, settings, cookieJar, cookieWrites,
		click: (id) => nodes.get(`#cookie-${id}`).listeners.get('click')(),
		commands: () => Array.from(window.dataLayer ?? [], (args) => Array.from(args)),
		advance: (amount) => { now += amount; [...timers.values()].forEach(({ fn }) => fn()); },
	};
}

test('first visit and rejection do not load or initialize Google', () => {
	const app = setup();
	assert.equal(app.nodes.get('#cookie-banner').hidden, false);
	assert.equal(app.window['ga-disable-G-CTBPCXYPXK'], true);
	assert.equal(app.scripts.length, 0);
	assert.equal(app.window.dataLayer, undefined);
	app.click('reject');
	assert.equal(app.scripts.length, 0);
	assert.equal(JSON.parse(app.values.get(KEY)).analytics, false);
	assert.equal(app.nodes.get('#cookie-banner').hidden, true);
});

test('acceptance loads exactly one tag with analytics-only consent and sanitized metadata', () => {
	const app = setup();
	app.click('accept');
	app.click('accept');
	app.events.get('pageshow')();
	assert.equal(app.scripts.length, 1);
	assert.equal(app.scripts[0].src, 'https://www.googletagmanager.com/gtag/js?id=G-CTBPCXYPXK');
	const commands = app.commands();
	assert.equal(commands[0][2].analytics_storage, 'denied');
	for (const key of ['ad_storage', 'ad_user_data', 'ad_personalization']) assert.equal(commands[0][2][key], 'denied');
	assert.equal(commands[1][2].analytics_storage, 'granted');
	const configs = commands.filter(([command]) => command === 'config');
	assert.equal(configs.length, 1);
	assert.equal(configs[0][2].page_location, 'https://gitbranch.name/');
	assert.equal(configs[0][2].page_referrer, '');
	assert.equal(configs[0][2].cookie_expires, AGE / 1000);
	assert.equal(configs[0][2].cookie_update, false);
});

test('returning visitors keep either choice without a banner', () => {
	for (const analytics of [false, true]) {
		const app = setup({ stored: saved(analytics) });
		assert.equal(app.nodes.get('#cookie-banner').hidden, true);
		assert.equal(app.scripts.length, analytics ? 1 : 0);
	}
});

test('withdrawal disables even a pending tag and removes only analytics cookies', () => {
	const app = setup({ stored: saved(true) });
	app.cookieJar.set('_ga', 'client');
	app.cookieJar.set('_ga_CTBPCXYPXK', 'session');
	app.cookieJar.set('necessary', 'keep');
	app.settings.listeners.get('click')();
	app.click('reject');
	assert.equal(app.window['ga-disable-G-CTBPCXYPXK'], true);
	assert.deepEqual([...app.cookieJar.keys()], ['necessary']);
	assert.equal(app.commands().at(-1)[2].analytics_storage, 'denied');
	assert.equal(JSON.parse(app.values.get(KEY)).analytics, false);
	app.click('accept');
	assert.equal(app.scripts.length, 1);
	assert.equal(app.window['ga-disable-G-CTBPCXYPXK'], false);
});

test('invalid, future, outdated and expired choices never enable analytics', () => {
	for (const stored of ['broken', 'null', '{}', saved(true, NOW + 1), saved(true, NOW - AGE), saved(true).replace('"version":1', '"version":0')]) {
		const app = setup({ stored });
		assert.equal(app.scripts.length, 0, stored);
		assert.equal(app.nodes.get('#cookie-banner').hidden, false, stored);
	}
});

test('storage failures allow a session choice without breaking the controls', () => {
	const app = setup({ blocked: true });
	app.click('accept');
	app.events.get('focus')();
	assert.equal(app.window['ga-disable-G-CTBPCXYPXK'], false);
	app.click('reject');
	app.events.get('focus')();
	assert.equal(app.window['ga-disable-G-CTBPCXYPXK'], true);
	assert.equal(app.nodes.get('#cookie-banner').hidden, true);
});

test('cross-tab withdrawal and clearing storage stop collection', () => {
	const app = setup({ stored: saved(true) });
	app.values.set(KEY, saved(false));
	app.events.get('storage')({ key: KEY });
	assert.equal(app.window['ga-disable-G-CTBPCXYPXK'], true);
	app.values.clear();
	app.events.get('storage')({ key: null });
	assert.equal(app.nodes.get('#cookie-banner').hidden, false);
});

test('a failed storage write never restores stale acceptance in the current page', () => {
	const app = setup({ stored: saved(true), writesBlocked: true });
	app.click('reject');
	app.events.get('focus')();
	app.events.get('pageshow')();
	assert.equal(app.window['ga-disable-G-CTBPCXYPXK'], true);
	assert.equal(app.values.has(KEY), false);
});

test('an open page stops collection when consent expires', () => {
	const app = setup({ stored: saved(true, NOW - AGE + 1000) });
	assert.equal([...app.timers.values()][0].delay, 1000);
	app.advance(1001);
	assert.equal(app.window['ga-disable-G-CTBPCXYPXK'], true);
	assert.equal(app.nodes.get('#cookie-banner').hidden, false);
});

test('closing settings or pressing Escape never grants consent', () => {
	const app = setup();
	app.settings.listeners.get('click')();
	app.click('close');
	app.nodes.get('#cookie-banner').listeners.get('keydown')({ key: 'Escape' });
	assert.equal(app.scripts.length, 0);
	assert.equal(app.values.has(KEY), false);
});
