/**
 * @module
 * Tools for working with the JSR module registry (on the server).
 * https://jsr.io/docs
 */
import { Jsr as Client } from '../../ns.client/m.Jsr/mod.ts';
import { Manifest } from '../m.Manifest/mod.ts';
import type { t } from './common.ts';

export const Jsr: t.JsrServerLib = {
  ...Client,
  Manifest,
};
