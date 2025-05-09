import { Path } from '../common.ts';

export { VIDEO } from '../ui.Programme.v/-VIDEO.ts';
export * from '../ui.Programme/common.ts';
export * from '../ui.Programme/u.ts';

/**
 * Path directory:
 */
export const Dir = {
  programme: Path.dir('/images/ui.Programme', 'posix'),
} as const;
