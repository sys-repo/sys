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
  enabled: true,
  readOnly: false,
  autoFocus: false,
  placeholder: 'document-id',
  spinning: false,
} as const;
export const D = DEFAULTS;
