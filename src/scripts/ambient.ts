/**
 * The backdrop: a git graph drifting upwards behind the glass.
 *
 * The pattern is woven once per resize into a `SPAN`-tall loop and tiled, so
 * strands are steered back to their own lane before the wrap — otherwise the
 * seam would read as a visible jump every time the loop repeats.
 */
import { must } from './dom';

interface Edge {
	x1: number;
	y1: number;
	x2: number;
	y2: number;
	hue: string;
}

interface Node {
	x: number;
	y: number;
	hue: string;
}

const HUES = ['#4ed494', '#6ba4ff', '#a98bff', '#46d6c4', '#ff77bb', '#ecb84a'];
const SPAN = 1848;
const STEP = 84;
const SPEED = 0.16;
const FORK_CHANCE = 0.22;
const NODE_CHANCE = 0.35;

const canvas = must<HTMLCanvasElement>('#ambient-graph');
const ctx = canvas.getContext('2d');
const stillness = window.matchMedia('(prefers-reduced-motion: reduce)');

let edges: Edge[] = [];
let nodes: Node[] = [];
let width = 0;
let height = 0;
let dpr = 1;
let offset = 0;
let frame = 0;

function weave(): void {
	edges = [];
	nodes = [];

	const lanes = Math.max(5, Math.min(11, Math.round(width / 150)));
	const gap = width / (lanes + 1);
	const laneX = (lane: number): number => gap * (lane + 1);

	const at = Array.from({ length: lanes }, (_, i) => i);
	const steps = Math.round(SPAN / STEP);
	const settle = Math.round(steps * 0.7);

	for (let step = 0; step < steps; step++) {
		const y1 = step * STEP;
		const y2 = y1 + STEP;

		at.forEach((lane, strand) => {
			let next = lane;

			if (step < settle) {
				if (Math.random() < FORK_CHANCE) {
					const drift = Math.random() < 0.5 ? -1 : 1;
					next = Math.max(0, Math.min(lanes - 1, lane + drift));
				}
			} else if (lane !== strand) {
				// Walk home so the loop tiles seamlessly.
				next = lane + Math.sign(strand - lane);
			}

			const hue = HUES[strand % HUES.length] ?? HUES[0]!;
			edges.push({ x1: laneX(lane), y1, x2: laneX(next), y2, hue });
			if (Math.random() < NODE_CHANCE) nodes.push({ x: laneX(next), y: y2, hue });
			at[strand] = next;
		});
	}
}

function strandAlpha(): number {
	const value = getComputedStyle(document.documentElement).getPropertyValue('--strand-alpha');
	const parsed = Number.parseFloat(value);
	return Number.isFinite(parsed) ? parsed : 0.5;
}

function draw(): void {
	if (!ctx) return;

	ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
	ctx.clearRect(0, 0, width, height);

	const alpha = strandAlpha();
	ctx.lineWidth = 1.6;
	ctx.lineCap = 'round';

	for (let tile = -1; tile * SPAN < height + SPAN; tile++) {
		const shift = tile * SPAN - (offset % SPAN);

		ctx.globalAlpha = alpha * 0.5;
		for (const edge of edges) {
			const y1 = edge.y1 + shift;
			const y2 = edge.y2 + shift;
			if (y2 < -40 || y1 > height + 40) continue;

			ctx.strokeStyle = edge.hue;
			ctx.beginPath();
			ctx.moveTo(edge.x1, y1);
			if (edge.x1 === edge.x2) ctx.lineTo(edge.x2, y2);
			else ctx.bezierCurveTo(edge.x1, y1 + STEP * 0.55, edge.x2, y2 - STEP * 0.55, edge.x2, y2);
			ctx.stroke();
		}

		ctx.globalAlpha = alpha;
		for (const node of nodes) {
			const y = node.y + shift;
			if (y < -20 || y > height + 20) continue;

			ctx.fillStyle = node.hue;
			ctx.beginPath();
			ctx.arc(node.x, y, 2.6, 0, Math.PI * 2);
			ctx.fill();
		}
	}

	ctx.globalAlpha = 1;
}

function resize(): void {
	dpr = Math.min(2, window.devicePixelRatio || 1);
	width = canvas.clientWidth;
	height = canvas.clientHeight;
	canvas.width = Math.round(width * dpr);
	canvas.height = Math.round(height * dpr);
	weave();
}

function tick(): void {
	offset += SPEED;
	draw();
	frame = requestAnimationFrame(tick);
}

function start(): void {
	cancelAnimationFrame(frame);
	if (stillness.matches) draw();
	else tick();
}

window.addEventListener('resize', () => {
	resize();
	if (stillness.matches) draw();
});

stillness.addEventListener('change', start);

resize();
start();
