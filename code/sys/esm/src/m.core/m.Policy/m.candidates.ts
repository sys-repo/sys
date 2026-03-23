import { type t, Semver } from './common.ts';

export const candidates: t.EsmPolicy.Lib['candidates'] = (input) => {
  const currentVersion = wrangle.clean(input.subject.current);
  const availableVersions = wrangle.sorted(input.subject.available);
  const latestVersion = availableVersions[0];

  const current: t.EsmPolicy.Candidate = { version: currentVersion };
  if (currentVersion === latestVersion) current.latest = true;
  current.current = true;

  const available = availableVersions.map((version) => {
    const candidate: t.EsmPolicy.Candidate = { version };
    if (version === currentVersion) candidate.current = true;
    if (version === latestVersion) candidate.latest = true;
    return candidate;
  });

  return { current, available };
};

const wrangle = {
  clean(version: t.StringSemver): t.StringSemver {
    return Semver.Prefix.strip(Semver.coerce(version).version) as t.StringSemver;
  },

  sorted(input: readonly t.StringSemver[]): t.StringSemver[] {
    const unique = [...new Set(input.map((version) => wrangle.clean(version)).filter(Boolean))];
    return Semver.sort(unique, { order: 'desc' }) as t.StringSemver[];
  },
} as const;
