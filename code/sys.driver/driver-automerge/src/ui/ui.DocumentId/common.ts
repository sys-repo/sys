import { pkg, Pkg } from '../common.ts';
export * from '../common.ts';

/**
 * Constants:
 */
const name = 'Input.DocumentId';
export const DEFAULTS = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  label: undefined,
  enabled: true,
  readOnly: false,
  autoFocus: false,
  placeholder: 'document-id',
  spinning: false,
  urlSupport: true,
} as const;
export const D = DEFAULTS;
