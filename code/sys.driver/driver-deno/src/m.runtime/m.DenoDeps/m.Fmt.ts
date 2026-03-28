import { type t, c, Cli, Semver } from './common.ts';

export const Fmt: t.DepsFmt = {
  deps(deps, options = {}) {
    if (!deps) return '';
    const indent = wrangle.indent(options.indent);
    const prefixes = deps.map((dep) => Semver.Prefix.get(dep.module.version)).filter(Boolean);
    const maxPrefixLength = prefixes.reduce((max, prefix) => Math.max(max, prefix.length), 0);

    const sorted = deps.toSorted((a, b) => a.module.registry.localeCompare(b.module.registry));
    const table = Cli.table([]);
    let prevRegistry: t.EsmRegistry = 'jsr';

    sorted.forEach((dep) => {
      const mod = dep.module;
      const registry = mod.registry === 'jsr' ? 'jsr' : mod.registry || 'npm';

      const isDiff = registry !== prevRegistry;
      prevRegistry = registry;
      if (isDiff) {
        table.push([]); // Blank line between registries.
      }

      const fmtModule = `${c.gray(`${registry}:`)}${c.white(mod.name)}`;
      const fmtVersion = wrangle.version(mod.version, maxPrefixLength);

      table.push([`${indent}${fmtVersion}`, fmtModule]);
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
    const prefix = Semver.Prefix.get(version);
    if (prefix) {
      const versionWithoutPrefix = version.slice(prefix.length);
      const indent = wrangle.indent(maxLength - prefix.length);
      return c.cyan(`${prefix}${indent}${versionWithoutPrefix}`);
    } else {
      return c.cyan(`${wrangle.indent(maxLength)}${version}`);
    }
  },
} as const;
