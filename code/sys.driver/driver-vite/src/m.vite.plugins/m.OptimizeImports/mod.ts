/**
 * @module
 * Controlled import-optimization plugin for `@sys/driver-vite`.
 *
 * This plugin rewrites approved broad package-root imports to approved public
 * narrow subpath imports.
 *
 * Why:
 * - reduce Vite dev/build graph cost on known hot broad-barrel surfaces
 * - keep the optimization central, explicit, and reviewable in the driver
 * - preserve canonical package export and import policy as the truth layer
 *
 * Invariants:
 * - rewrites are explicit and allowlisted
 * - targets must be stable public exports
 * - unknown imports are left unchanged
 * - this plugin is a performance adapter, not an import-policy authority
 */
import type { t } from './common.ts';

export const OptimizeImportsPlugin: t.OptimizeImportsPlugin.Lib = {};
