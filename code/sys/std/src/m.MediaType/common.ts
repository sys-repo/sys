export * from '../common.ts';
export { Is } from '../m.Is/mod.ts';
export { Path } from '../m.Path/mod.ts';
export { contentType, formatMediaType, parseMediaType, typeByExtension } from '@std/media-types';

/**
 * Constants:
 */
export const FALLBACK_BINARY = 'application/octet-stream' as const;
export const FALLBACK_TEXT = 'text/plain' as const;
