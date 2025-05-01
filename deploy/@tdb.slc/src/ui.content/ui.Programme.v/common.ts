import { dirPath } from '../common.ts';
export { VIDEO } from '../ui.Programme/-VIDEO.ts';
export * from '../ui.Programme/common.ts';
export * from '../ui.Programme/u.ts';

/**
 * Path directory:
 */
export const Dir = {
  programme: dirPath('/images/ui.Programme'),
} as const;
