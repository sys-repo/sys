import { type t, c, Cli, Semver } from './common.ts';

export const Fmt: t.DenoDepsFmt = {
  deps(deps, options = {}) {
    if (!deps) return '';
    const indent = wrangle.indent(options.indent);
    const prefixes = deps.map((dep) => Semver.Prefix.get(dep.module.version)).filter(Boolean);
    const maxPrefixLength = prefixes.reduce((max, prefix) => Math.max(max, prefix.length), 0);

    const table = Cli.table([]);
    deps.forEach((dep) => {
      const mod = dep.module;
      const registry = mod.prefix === 'jsr' ? 'jsr' : mod.prefix || 'npm';

      const [left, right] = mod.name.split('/');
      const name = right ? right : left;
      const scope = right ? `${left}/` : '';

      const fmtRegistry = ` ${c.gray(registry.toUpperCase())}`;
      const fmtName = c.gray(`${scope}${c.white(name)}`);
      const fmtVersion = wrangle.version(mod.version, maxPrefixLength);

      table.push([`${indent}${fmtName}`, fmtVersion, fmtRegistry]);
    });

    return `${indent}${table.toString().trim()}`;
  },
};

/**
 * Helpers
 */
const wrangle = {
  indent(length: number = 0) {
    return length ? ' '.repeat(length) : '';
  },

  version(version: t.StringSemver, maxLength: number) {
    const prefix = Semver.Prefix.get(version);
    if (prefix) {
      const versionWithoutPrefix = version.slice(prefix.length);
      const coloredPrefix = c.gray(prefix);
      const indent = wrangle.indent(maxLength - prefix.length);
      return `${coloredPrefix}${indent}${Semver.Fmt.colorize(versionWithoutPrefix)}`;
    } else {
      return `${wrangle.indent(maxLength)}${Semver.Fmt.colorize(version)}`;
    }
  },
} as const;
