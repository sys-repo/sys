import { type t, Base, c } from './common.ts';

export const Fmt: t.SemverServerFmt = {
  colorize(input, options = {}) {
    const {
      highlight,
      baseColor = c.brightCyan,
      prefixColor = c.yellow,
      prereleaseColor = c.yellow,
    } = options;

    const fmt = (kind: t.SemverReleaseType, value: number): string => {
      const text = String(value);
      if (!highlight) return baseColor(text);
      else return kind === highlight ? baseColor(c.bold(text)) : baseColor(c.dim(text));
    };

    const text = Base.toString(input);
    const prefix = Base.Prefix.get(text);
    const version = Base.Prefix.strip(text);

    const p = Base.parse(Base.coerce(version).version);
    const v = p.version;
    const major = fmt('major', v.major);
    const minor = fmt('minor', v.minor);
    const patch = fmt('patch', v.patch);
    const pre = v.prerelease.length === 0 ? '' : prereleaseColor(`-${v.prerelease.join('.')}`);

    const dot = c.dim(baseColor('.'));
    const ver = `${major}${dot}${minor}${dot}${patch}`;

    return `${prefixColor(prefix)}${ver}${pre}`;
  },
};
