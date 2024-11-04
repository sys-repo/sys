import type * as t from './t.ts';

const jsr: t.ImageBadge = {
  image: 'https://github.com/sys-repo/sys/actions/workflows/jsr.yml/badge.svg',
  href: 'https://github.com/sys-repo/sys/actions/workflows/jsr.yml',
} as const;

/**
 * Links to common CI badges.
 */
export const BADGES = { ci: { jsr } } as const;
