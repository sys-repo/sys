/**
 * @module
 * Driver-owned Vite plugin surfaces for `@sys/driver-vite`.
 *
 * This module groups focused Vite plugins that are composed centrally by the
 * driver to keep Vite behavior explicit and consistent across adopting apps.
 */
import type { t } from './common.ts';

export const VitePlugins: t.VitePlugins.Lib = {};
