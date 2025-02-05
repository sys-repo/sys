import { type t, Semver } from './common.ts';
import { parse } from './u.parse.ts';
import { toString } from './u.toString.ts';

export const Latest = {
  name(items: t.EsmParsedImport[], input: t.StringModuleSpecifier): t.StringSemver {
    const name = parse(input).name;
    const matches = items.filter((m) => m.name === name);
    const versions = matches.map((m) => m.version);
    const sorted = Semver.sort(versions, { order: 'desc' });
    return sorted[0] ?? '';
  },

  deps(items: t.EsmParsedImport[], input: t.EsmImportMap): t.EsmImportMap {
    const res: t.EsmImportMap = { ...input };
    Object.entries(res).forEach(([key, value]) => {
      const latest = Latest.name(items, key);
      const current = wrangle.version(value);
      if (wrangle.gt(latest, current)) {
        res[key] = wrangle.value(value, latest);
      }
    });
    return res;
  },
} as const;

/**
 * Helpers
 */
const wrangle = {
  version(value: string) {
    const coerced = Semver.coerce(value);
    return coerced.version && !coerced.error ? coerced.version : parse(value).version;
  },

  value(value: string, version: t.StringSemver) {
    value = value.trim();
    if (!value) return version;
    const coerced = Semver.coerce(value);
    return coerced.error ? toString(parse(value), { version }) : version;
  },

  gt(a: t.StringSemver, b: t.StringSemver) {
    const clean = (ver: string) => Semver.Prefix.strip(Semver.coerce(ver).version);
    a = clean(a);
    b = clean(b);
    return Semver.Is.greaterThan(Semver.parse(a), Semver.parse(b));
  },
} as const;
