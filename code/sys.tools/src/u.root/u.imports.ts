/**
 * Dynamic CLI module imports keyed by tool command.
 *
 * Values are fully inferred from `import()`.
 * Keys are canonical tool IDs.
 */
export const Imports = {
  copy: () => import('../cli.clipboard/mod.ts'),
  crdt: () => import('../cli.crdt/mod.ts'),
  deploy: () => import('../cli.deploy/mod.ts'),
  fs: () => import('../cli.fs/mod.ts'),
  serve: () => import('../cli.serve/mod.ts'),
  update: () => import('../cli.update/mod.ts'),
  video: () => import('../cli.video/mod.ts'),
} as const;
