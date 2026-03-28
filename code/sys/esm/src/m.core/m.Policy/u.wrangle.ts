import { type t, Semver } from './common.ts';

export const wrangle = {
  excluded(policy: t.EsmPolicy.Def, entry: t.EsmDeps.Entry) {
    const excludes = policy.exclude ?? [];
    const name = entry.module.name;
    const alias = entry.module.alias ?? '';
    return excludes.includes(name) || (!!alias && excludes.includes(alias));
  },

  select(mode: t.EsmPolicy.Mode, selection: t.EsmPolicy.Selection) {
    const current = selection.current.version;
    return selection.available.find((candidate) => {
      const version = candidate.version;
      if (!Semver.Is.greaterThan(version, current)) return false;
      if (mode === 'latest') return true;
      if (mode === 'minor') return wrangle.sameMajor(version, current);
      if (mode === 'patch') return wrangle.sameMinor(version, current);
      return false;
    });
  },

  reason(mode: t.EsmPolicy.Mode, selection: t.EsmPolicy.Selection): t.EsmPolicy.BlockedCode {
    const hasNewer = selection.available.some((candidate) =>
      Semver.Is.greaterThan(candidate.version, selection.current.version)
    );
    if (!hasNewer) return 'version:not-newer';
    return mode === 'patch' || mode === 'minor' ? 'version:not-allowed' : 'version:not-newer';
  },

  sameMajor(a: t.StringSemver, b: t.StringSemver) {
    const av = Semver.parse(a).version;
    const bv = Semver.parse(b).version;
    return av.major === bv.major;
  },

  sameMinor(a: t.StringSemver, b: t.StringSemver) {
    const av = Semver.parse(a).version;
    const bv = Semver.parse(b).version;
    return av.major === bv.major && av.minor === bv.minor;
  },
} as const;
