/**
 * @module
 * Testing tools.
 */
export { Path, slug } from '@sys/std';
export { Fs } from '@sys/std-s';
export { Testing, describe, expect, it } from '@sys/std/testing';

/**
 * Local
 */
export * from '../common.ts';
export { default as rootDenofileJson } from '../../../../../deno.json' with { type: 'json' };
