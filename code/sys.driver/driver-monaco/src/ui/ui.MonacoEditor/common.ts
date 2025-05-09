import { type t, DEFAULTS as BASE, pkg, Pkg } from '../common.ts';
export * from '../common.ts';

/**
 * Constants:
 */
const name = 'MonacoEditor';
const props: t.PickRequired<
  t.MonacoEditorProps,
  'theme' | 'readOnly' | 'minimap' | 'tabSize' | 'language' | 'enabled'
> = {
  theme: 'Dark',
  enabled: true,
  readOnly: false,
  minimap: true,
  tabSize: 2,
  language: BASE.languages[0],
};
export const DEFAULTS = {
  ...BASE,
  name,
  displayName: Pkg.toString(pkg, name),
  props,
} as const;
export const D = DEFAULTS;
