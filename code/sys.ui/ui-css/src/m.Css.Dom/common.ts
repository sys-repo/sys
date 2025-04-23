import { pixelProps } from './const.pixelProps.ts';

export * from '../common.ts';
export { CssTmpl } from '../m.Css.Tmpl/mod.ts';

/**
 * Constants.
 */
export const DEFAULT = {
  classPrefix: 'sys',
  get pixelProps() {
    return pixelProps;
  },
} as const;
