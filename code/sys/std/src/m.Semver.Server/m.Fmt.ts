import { type t, Base, c } from './common.ts';

export const Fmt: t.SemverServerFmt = {
  colorize(input, options = {}) {
    const { highlight, baseColor = c.brightCyan, prefixColor = c.magenta } = options;

    const fmt = (kind: t.SemverReleaseType, value: number): string => {
      const text = String(value);
      if (!highlight) return baseColor(text);
      else return kind === highlight ? baseColor(c.bold(text)) : baseColor(c.dim(text));
    };

    const text = Base.toString(input);
    const prefix = Base.Prefix.get(text);
    const version = Base.Prefix.strip(text);

    const v = Base.parse(version).version;
    const major = fmt('major', v.major);
    const minor = fmt('minor', v.minor);
    const patch = fmt('patch', v.patch);

    const dot = c.dim(baseColor('.'));
    const fmtVersion = `${major}${dot}${minor}${dot}${patch}`;

    return `${prefixColor(prefix)}${fmtVersion}`;
  },
};
