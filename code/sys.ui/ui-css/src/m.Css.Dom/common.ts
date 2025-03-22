import toHash from 'hash-it';
import { pixelProps } from './const.pixelProps.ts';
import { pseudoClasses } from './const.pseudoClasses.ts';

export * from '../common.ts';
export { CssTmpl } from '../m.Css.Tmpl/mod.ts';
export { toHash };

/**
 * Constants.
 */
export const DEFAULT = {
  classPrefix: 'sys',
  get pseudoClasses() {
    return pseudoClasses;
  },
  get pixelProps() {
    return pixelProps;
  },
} as const;
