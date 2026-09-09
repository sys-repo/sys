/**
 * @module
 * Tools for pulling the source-code (typescript)
 * of a module within the registry.
 */
import { create } from './u.create.ts';
import { fetch } from './u.fetch.ts';
import type { t } from './common.ts';

/**
 * Tools for working with a module's source-code.
 */
export const Manifest: t.JsrManifest.Lib = Object.freeze({
  create,
  fetch,
});
