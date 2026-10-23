import type { t } from './common.ts';

const names = [
  'list',
  'stat',
  'read',
  'write',
  'remove',
  'watch',
  'manifest',
] as const satisfies t.Files.Capability.Names;

/**
 * Canonical Files capability names.
 */
export const Capability: t.Files.Capability.Lib = { names };
