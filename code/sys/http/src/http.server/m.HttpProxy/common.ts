export * from '../common.ts';
export { HttpServer } from '../m.HttpServer/mod.ts';
export { HttpClient } from '../../http.client/mod.ts';

/**
 * Defaults:
 */
export const D = {
  port: 4040,
} as const;
