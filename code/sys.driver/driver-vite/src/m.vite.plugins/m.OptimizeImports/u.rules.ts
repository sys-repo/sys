import type { t } from './common.ts';

/**
 * Default fallback rules when no derived workspace/package rule dataset is provided.
 *
 * The intended steady-state authority is derived package/barrel analysis wired by
 * `Vite.Config.app(...)`, so the package default remains empty.
 */
export const DEFAULT_PACKAGE_RULES: readonly t.OptimizeImportsPlugin.PackageRule[] = [] as const;
