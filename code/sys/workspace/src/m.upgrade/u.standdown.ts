import { Is, Num, Obj, Semver, type t, Time } from './common.ts';

export type StanddownInput = {
  readonly registry: t.EsmRegistry;
  readonly current: t.StringSemver;
  readonly available: readonly t.StringSemver[];
  readonly versions: Record<string, unknown>;
  readonly minimumDependencyAge: t.Msecs;
  readonly evaluatedAt: t.UnixTimestamp;
};

export type StanddownResult = {
  readonly eligible: readonly t.StringSemver[];
  readonly versions: readonly t.WorkspaceUpgrade.VersionFact[];
};

/**
 * Derive selection eligibility from visible registry facts.
 *
 * Standdown is deliberately a workspace planning concern: registry clients expose
 * publish-time facts; policy selection receives only eligible versions.
 */
export const Standdown = Object.freeze(
  {
    evaluate(input: StanddownInput): StanddownResult {
      const meta = wrangle.metaByVersion(input.versions);

      const versions = input.available.map((version) => {
        const publishedAt = wrangle.publishedAt(meta.get(version));
        const eligibility = wrangle.eligibility({ ...input, publishedAt, version });
        return publishedAt ? { version, publishedAt, eligibility } : { version, eligibility };
      });

      const eligible = versions
        .filter((item) => item.eligibility.kind === 'eligible')
        .map((item) => item.version);

      return { eligible, versions };
    },
  } as const,
);

const wrangle = {
  metaByVersion(input: Record<string, unknown>): Map<t.StringSemver, unknown> {
    const res = new Map<t.StringSemver, unknown>();
    for (const [version, meta] of Obj.entries(input ?? {})) {
      const clean = wrangle.clean(String(version));
      if (!clean || res.has(clean)) continue;
      res.set(clean, meta);
    }
    return res;
  },

  clean(input: string): t.StringSemver | undefined {
    const version = Semver.Prefix.strip(Semver.coerce(input).version);
    return Is.str(version) && version.length > 0 ? (version as t.StringSemver) : undefined;
  },

  publishedAt(meta: unknown): t.StringTimestamp | undefined {
    if (!Obj.isRecord(meta)) return undefined;
    const publishedAt = meta.publishedAt;
    if (!Is.str(publishedAt)) return undefined;
    return Num.Is.finite(wrangle.timestamp(publishedAt))
      ? (publishedAt as t.StringTimestamp)
      : undefined;
  },

  eligibility(
    input: Omit<StanddownInput, 'evaluatedAt'> & {
      readonly version: t.StringSemver;
      readonly publishedAt?: t.StringTimestamp;
      readonly evaluatedAt: t.UnixTimestamp;
    },
  ): t.WorkspaceUpgrade.VersionEligibility {
    if (input.minimumDependencyAge === 0) return { kind: 'eligible' };
    if (input.registry !== 'npm') return { kind: 'eligible' };
    if (input.version === input.current) return { kind: 'eligible' };

    if (!input.publishedAt) return { kind: 'unknown-published-at' };
    const publishedAt = wrangle.timestamp(input.publishedAt);
    if (!Num.Is.finite(publishedAt)) return { kind: 'unknown-published-at' };
    if (publishedAt > input.evaluatedAt) return { kind: 'unknown-published-at' };

    const eligibleAt = publishedAt + input.minimumDependencyAge;
    if (eligibleAt <= input.evaluatedAt) return { kind: 'eligible' };

    return {
      kind: 'standdown',
      eligibleAt,
      age: input.evaluatedAt - publishedAt,
    };
  },

  timestamp(input: t.StringTimestamp): t.UnixTimestamp {
    return Time.utc(input).timestamp;
  },
} as const;
