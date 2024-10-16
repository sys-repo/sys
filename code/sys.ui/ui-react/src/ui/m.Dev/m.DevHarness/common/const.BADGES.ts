import * as t from './t';

const node: t.ImageBadge = {
  image: 'https://github.com/cellplatform/platform-0.2.0/actions/workflows/ci.node.yml/badge.svg',
  href: 'https://github.com/cellplatform/platform-0.2.0/actions/workflows/ci.node.yml',
} as const;

/**
 * Links to badges.
 */
export const BADGES = { ci: { node } } as const;
