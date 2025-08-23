import { type t, pkg, Pkg } from '../common.ts';
export * from '../common.ts';

export { useFactory } from '../../m.react/mod.ts';

type P = t.SampleReactProps;

/**
 * Constants:
 */
const name = 'HostAdapter.React.Sample';
export const DEFAULTS = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  strategy: 'suspense' satisfies P['strategy'],
} as const;
export const D = DEFAULTS;
