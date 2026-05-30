/**
 * @module
 * Tools for working with the JSR module registry (on the server).
 * https://jsr.io/docs
 */
import { Jsr as Base } from '../../m.client/m.Jsr/mod.ts';
import { Manifest } from '../m.Manifest/mod.ts';
import { type t } from './common.ts';

/** Server-side registry helper. */
export const Jsr: t.JsrServer.Lib = {
  ...Base,
  Manifest,
  manifest: Manifest.fetch,
};
