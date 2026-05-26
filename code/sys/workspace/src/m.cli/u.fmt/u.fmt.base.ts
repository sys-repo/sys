import { c, Cli, Semver, type t } from '../common.ts';

export const FmtBase = {
  key(entry: t.EsmDeps.Entry): string {
    return `${entry.module.registry}:${entry.module.name}`;
  },

  name(entry: t.EsmDeps.Entry): string {
    const alias = entry.module.alias ? c.gray(` (${entry.module.alias})`) : '';
    return `${c.white(entry.module.name)}${alias}`;
  },

  pad(value: string, width: number): string {
    const len = FmtBase.width(value);
    return len >= width ? value : `${value}${' '.repeat(width - len)}`;
  },

  width(value: string): number {
    return Cli.stripAnsi(value).length;
  },

  truncate(value: string, width: number): string {
    if (value.length <= width) return value;
    if (width <= 1) return value.slice(0, width);
    return `${value.slice(0, Math.max(0, width - 1))}…`;
  },

  indentTable(input: string): string {
    return input
      .split('\n')
      .map((line) => (line.trim() ? `  ${line}` : line))
      .join('\n');
  },

  canonicalVersion(version?: string): t.StringSemver | undefined {
    if (!version) return;
    const coerced = Semver.coerce(version).version;
    const clean = Semver.Prefix.strip(coerced);
    return clean ? (clean as t.StringSemver) : undefined;
  },
} as const;
