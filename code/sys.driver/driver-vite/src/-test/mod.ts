/**
 * @module
 * Testing tools.
 */
export { Path, slug } from '@sys/std';
export { Fs } from '@sys/std-s';
export { describe, expect, it, Testing } from '@sys/std/testing';

/**
 * Local
 */
export * from '../common.ts';

/**
 * Workspace `deno.json` file.
 */
import { default as denofile } from '../../../../../deno.json' with { type: 'json' };
export const ROOT_DENOFILE = {
  path: '../../../deno.json', // NB: relative to executing module
  json: denofile
};
