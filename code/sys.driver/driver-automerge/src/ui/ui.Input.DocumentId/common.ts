import { pkg, Pkg } from '../common.ts';
export * from '../common.ts';

/**
 * Constants:
 */
const name = 'Input.DocumentId';
export const DEFAULTS = {
  name,
  displayName: Pkg.toString(pkg, name),
  label: undefined,
  autoFocus: false,
  placeholder: 'document-id',
} as const;
export const D = DEFAULTS;
