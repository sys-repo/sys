import { type t, Base, c } from './common.ts';

export const Fmt: t.SemverServerFmt = {
  colorize(input) {
    const text = Base.toString(input);
    const prefix = Base.Prefix.get(text);
    const version = Base.Prefix.strip(text);

    /**
     * TODO 🐷
     * - compare: 1.0.0 → 1.0.1 (highlight the ".1")
     */

    return `${c.magenta(prefix)}${c.green(version)}`;
  },
};
