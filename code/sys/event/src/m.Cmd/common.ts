import { slug } from '../common.ts';
export * from '../common.ts';

/**
 * Simple id generator
 */
export function createId(): string {
  return `req-${slug()}`;
}
