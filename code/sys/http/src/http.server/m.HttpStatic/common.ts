export * from '../common.ts';
export { HttpServer } from '../m.HttpServer/mod.ts';

/**
 * Defaults:
 */
export const D = {
  dir: '.',
  hostname: '127.0.0.1',
  port: 4040,
} as const;
