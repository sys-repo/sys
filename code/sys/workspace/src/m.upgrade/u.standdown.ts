import { Err, Is, Num, Obj, Semver, type t } from './common.ts';
import { StanddownTime } from './u.standdown.time.ts';

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
 * Publication age limits selection, not visibility.
 * Keep each release's evidence so callers can explain why it was withheld.
 */
export const Standdown = Object.freeze(
  {
    evaluate(input: StanddownInput): StanddownResult {
      StanddownTime.minimumAge(input.minimumDependencyAge);
      StanddownTime.evaluatedAt(input.evaluatedAt);
      const meta = wrangle.metaByVersion(input.versions);

      const versions = input.available.map((version) => {
        const evidence = meta.get(version);
        const source = Obj.isRecord(evidence)
          ? evidence[input.registry === 'jsr' ? 'createdAt' : 'publishedAt']
          : undefined;
        const timestamp = StanddownTime.publication(source);
        const publishedAt = Is.str(source) && timestamp !== undefined ? source : undefined;
        const eligibility = wrangle.eligibility({
          current: input.current,
          minimumDependencyAge: input.minimumDependencyAge,
          evaluatedAt: input.evaluatedAt,
          timestamp,
          version,
        });
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

  eligibility(
    input: Pick<StanddownInput, 'current' | 'minimumDependencyAge' | 'evaluatedAt'> & {
      readonly version: t.StringSemver;
      readonly timestamp?: t.UnixTimestamp;
    },
  ): t.WorkspaceUpgrade.VersionEligibility {
    if (input.minimumDependencyAge === 0) return { kind: 'eligible' };
    if (input.version === input.current) return { kind: 'eligible' };

    const publishedAt = input.timestamp;
    if (publishedAt === undefined) return { kind: 'unknown-published-at' };
    if (publishedAt > input.evaluatedAt) return { kind: 'unknown-published-at' };

    const eligibleAt = publishedAt + input.minimumDependencyAge;
    if (!Num.Is.safeInt(eligibleAt) || Math.abs(eligibleAt) > StanddownTime.maxTimestamp) {
      throw Err.std(
        `Unsupported dependency standdown deadline: ${publishedAt} + ${input.minimumDependencyAge}`,
      );
    }
    if (eligibleAt <= input.evaluatedAt) return { kind: 'eligible' };

    return {
      kind: 'standdown',
      eligibleAt,
      age: input.evaluatedAt - publishedAt,
    };
  },
} as const;
