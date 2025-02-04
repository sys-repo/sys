import { type t, Semver } from './common.ts';
import { parse } from './u.parse.ts';

export const Latest = {
  name(items: t.EsmParsedImport[], input: t.StringModuleSpecifier): t.StringSemver {
    const name = parse(input).name;
    const matches = items.filter((m) => m.name === name);
    const versions = matches.map((m) => Semver.Prefix.strip(m.version));
    const sorted = Semver.sort(versions, { order: 'desc' });
    return sorted[0] ?? '';
  },

  deps(items: t.EsmParsedImport[], input: t.EsmImportMap): t.EsmImportMap {
    const res: t.EsmImportMap = { ...input };
    Object.keys(res).forEach((key) => {});

  },
} as const;
