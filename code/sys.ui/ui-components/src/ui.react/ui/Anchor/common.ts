import { Pkg, pkg, type t } from '../common.ts';

export * from '../common.ts';
export { FocusStyle } from '../../../m.style/m.FocusStyle/mod.ts';

type P = t.Anchor.Props;

/**
 * Constants:
 */
const name = 'Anchor';
export const D = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  enabled: true satisfies P['enabled'],
  disabledOpacity: 0.3 as t.Percent,
  target: undefined satisfies P['target'],
  download: false satisfies P['download'],
  iconSize: '1em' satisfies t.IconProps['size'],
  iconGap: { leading: 3, trailing: 2 },
  link: {
    openIn: 'self' satisfies t.Anchor.Link.Props['openIn'],
    openHint: 'Opens in a new tab',
  },
} as const;
export const DEFAULTS = D;
export const STORAGE_KEY = { DEV: `dev:${D.displayName}` };
