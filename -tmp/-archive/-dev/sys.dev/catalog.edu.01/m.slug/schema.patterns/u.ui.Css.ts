import { type t, V } from './common.ts';

/**
 * CSS-related recipe constructors.
 */
export const Css: t.CssSpecLib = {
  Margin() {
    const scalar = V.union([V.number({ minimum: 0 }), V.string()]);

    const one = V.array(scalar, { minItems: 1, maxItems: 1 });
    const two = V.array(scalar, { minItems: 2, maxItems: 2 });
    const four = V.array(scalar, { minItems: 4, maxItems: 4 });

    return V.union([scalar, one, two, four], {
      description: 'CSS margin shorthand: number>=0 | string | [v] | [v,v] | [v,v,v,v]',
    });
  },
};
