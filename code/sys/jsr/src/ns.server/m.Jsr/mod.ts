/**
 * Tools for working with the JSR module registry (on the server).
 * https://jsr.io/docs
 * @module
 */
import type { JsrServerLib } from './t.ts';

import { Jsr as Base } from '../../ns.client/m.Jsr/mod.ts';
import { Manifest } from '../m.Manifest/mod.ts';

export const Jsr: JsrServerLib = {
  ...Base,
  Manifest,
  manifest: Manifest.fetch,
};
