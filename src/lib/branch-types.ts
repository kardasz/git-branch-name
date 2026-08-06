/** Branch prefixes offered in the options panel, in display order. */
export const BRANCH_TYPES = [
	'feature',
	'bugfix',
	'hotfix',
	'release',
	'chore',
	'docs',
	'refactor',
	'test',
] as const;

export type BranchType = (typeof BRANCH_TYPES)[number];

/**
 * The colour token for a branch type — `null` is the unprefixed name.
 * Token names mirror the type names (`--t-feature`, `--t-none`, …).
 */
export function hueOf(type: BranchType | null): string {
	return `var(--t-${type ?? 'none'})`;
}

export function isBranchType(value: string): value is BranchType {
	return (BRANCH_TYPES as readonly string[]).includes(value);
}
