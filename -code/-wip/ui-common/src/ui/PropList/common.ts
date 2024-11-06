import { pkg, type t } from '../common.ts';

export { Button } from '../Button/mod.ts';
export { Chip } from '../Chip/mod.ts';
export * from '../common.ts';
export { Icons } from '../Icons.ts';
export { Spinner } from '../Spinner/mod.ts';

/**
 * Constants
 */
const name = 'PropList';
const theme: t.CommonTheme = 'Light';

export const DEFAULTS = {
  name,
  displayName: `${pkg.name}:${name}`,
  theme,
  fontSize: { sans: 12, mono: 11 },
  messageDelay: 1500,
} as const;
