/**
 * Transitional facade:
 * - `runSlugTreeFs` points at OLD during tree-fs transform migration.
 * - `_NEW` is available for parity-gated comparison before promotion.
 */
export { runSlugTreeFs_OLD, runSlugTreeFs_OLD as runSlugTreeFs } from './u.bundle.tree.fs_OLD.ts';
export { runSlugTreeFs_NEW } from './u.bundle.tree.fs_NEW.ts';
