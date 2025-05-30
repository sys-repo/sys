import type * as t from './t.ts';

const jsr: t.ImageBadge = {
  image: 'https://github.com/sys-repo/sys/actions/workflows/jsr.yaml/badge.svg',
  href: 'https://github.com/sys-repo/sys/actions/workflows/jsr.yaml',
} as const;

/**
 * Links to common CI badges.
 */
export const Badges = { ci: { jsr } } as const;
