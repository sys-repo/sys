import { type t, c, Cli, R, Semver } from './common.ts';

export const Fmt: t.DepsFmt = {
  deps(deps, options = {}) {
    if (!deps) return '';
    const indent = wrangle.indent(options.indent);
    const prefixes = deps.map((dep) => Semver.Prefix.get(dep.module.version)).filter(Boolean);
    const maxPrefixLength = prefixes.reduce((max, prefix) => Math.max(max, prefix.length), 0);

    const sorted = R.sortBy((m) => m.module.registry, deps);
    const table = Cli.table([]);
    let prevRegistry: t.EsmRegistry = 'jsr';

    sorted.forEach((dep) => {
      const mod = dep.module;
      const registry = mod.registry === 'jsr' ? 'jsr' : mod.registry || 'npm';

      const isDiff = registry !== prevRegistry;
      prevRegistry = registry;
      if (isDiff) {
        table.push([]); // Blank line between registries.
        return;
      }

      const [left, right] = mod.name.split('/');
      const name = right ? right : left;
      const scope = right ? `${left}/` : '';

      const fmtRegistry = ` ${c.gray(registry.toUpperCase())}`;
      const fmtName = c.gray(`${scope}${c.white(name)}`);
      const fmtVersion = wrangle.version(mod.version, maxPrefixLength);

      table.push([`${indent}${fmtVersion}`, fmtName, fmtRegistry]);
    });

    return `${indent}↓${indent}${table.toString().trimEnd()}`;
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
    const colorize = (version: string) => Semver.Fmt.colorize(version, { highlight: 'major' });
    const prefix = Semver.Prefix.get(version);
    if (prefix) {
      const versionWithoutPrefix = version.slice(prefix.length);
      const coloredPrefix = c.yellow(prefix);
      const indent = wrangle.indent(maxLength - prefix.length);
      return `${coloredPrefix}${indent}${colorize(versionWithoutPrefix)}`;
    } else {
      return `${wrangle.indent(maxLength)}${colorize(version)}`;
    }
  },
} as const;
