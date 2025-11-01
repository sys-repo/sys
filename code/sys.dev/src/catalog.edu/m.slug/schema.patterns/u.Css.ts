import { type t, V } from './common.ts';

/**
 * CSS-related recipe constructors.
 */
export const Css: t.CssSpecLib = {
  Margin() {
    return V.union([V.number({ minimum: 0 }), V.string()], {
      description: 'CSS margin shorthand (number >= 0 or string)',
    });
  },
};
