/**
 * Tools for pulling the source-code (typescript)
 * of a module within the registry.
 * @module
 */
import type { JsrManifestLib } from './t.ts';

import { create } from './u.create.ts';
import { fetch } from './u.fetch.ts';

/**
 * Tools for working with a module's source-code.
 */
export const Manifest: JsrManifestLib = {
  create,
  fetch,
};
