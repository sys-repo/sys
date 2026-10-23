import { c, Num, Semver, type t, Time } from '../common.ts';
import { FmtBase } from './u.fmt.base.ts';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export type StanddownRow = {
  readonly candidate: t.WorkspaceUpgrade.Candidate;
  readonly fact: t.WorkspaceUpgrade.VersionFact;
  readonly selected?: t.StringSemver;
};

export const FmtStanddown = Object.freeze(
  {
    rows(
      upgrade: t.WorkspaceUpgrade.Result,
      decisions: ReadonlyMap<string, t.EsmPolicy.Decision> = wrangle.decisions(upgrade),
    ): readonly StanddownRow[] {
      return upgrade.collect.candidates.flatMap((candidate) => {
        const fact = FmtStanddown.latestFact(candidate);
        if (!fact) return [];
        const decision = decisions.get(FmtBase.key(candidate.entry));
        return [{ candidate, fact, selected: wrangle.selected(decision) }] as const;
      });
    },

    count(upgrade: t.WorkspaceUpgrade.Result): number {
      return FmtStanddown.rows(upgrade).length;
    },

    latestFact(
      candidate: t.WorkspaceUpgrade.Candidate,
    ): t.WorkspaceUpgrade.VersionFact | undefined {
      if (!candidate.latest) return undefined;
      if (!Semver.Is.greaterThan(candidate.latest, candidate.current)) return undefined;
      const fact = candidate.versions.find((item) => item.version === candidate.latest);
      if (!fact || fact.eligibility.kind === 'eligible') return undefined;
      return fact;
    },

    hasSelectableUpgrade(candidate: t.WorkspaceUpgrade.Candidate): boolean {
      return candidate.eligible.some((version) =>
        Semver.Is.greaterThan(version, candidate.current)
      );
    },

    disabled(candidate: t.WorkspaceUpgrade.Candidate, decision?: t.EsmPolicy.Decision): boolean {
      if (candidate.available.length === 0) return true;
      if (!FmtStanddown.latestFact(candidate)) return false;
      if (decision?.ok) return false;
      return !FmtStanddown.hasSelectableUpgrade(candidate);
    },

    selectionNote(candidate: t.WorkspaceUpgrade.Candidate, evaluatedAt?: t.UnixTimestamp): string {
      const fact = FmtStanddown.latestFact(candidate);
      if (!fact) return '';
      if (fact.eligibility.kind === 'unknown-published-at') {
        return 'newer in standdown - publish timestamp unavailable';
      }
      if (fact.eligibility.kind !== 'standdown' || evaluatedAt === undefined) {
        return 'newer in standdown';
      }
      return `newer in standdown - age eligible in ${
        FmtStanddown.countdown(fact.eligibility.eligibleAt - evaluatedAt)
      }`;
    },

    age(fact: t.WorkspaceUpgrade.VersionFact): string {
      if (fact.eligibility.kind !== 'standdown') return c.gray('-');
      return `${FmtStanddown.duration(fact.eligibility.age)} ${c.gray('ago')}`;
    },

    eligibleAfter(fact: t.WorkspaceUpgrade.VersionFact, evaluatedAt: t.UnixTimestamp): string {
      if (fact.eligibility.kind === 'unknown-published-at') {
        return c.yellow('publish timestamp unavailable');
      }
      if (fact.eligibility.kind !== 'standdown') return c.gray('-');
      const remaining = fact.eligibility.eligibleAt - evaluatedAt;
      if (remaining <= 0) return c.green('now');
      return FmtStanddown.countdown(remaining);
    },

    countdown(input: t.Msecs): string {
      if (input <= 0) return 'now';
      if (input < 1000) return '<1s';
      if (input < MINUTE) return `${Math.ceil(input / 1000)}s`;
      if (input < HOUR) return `${Math.ceil(input / MINUTE)}m`;
      if (input < 2 * DAY) return `${Math.ceil(input / HOUR)}h`;
      return `${Math.ceil(input / DAY)}d`;
    },

    duration(input: t.Msecs): string {
      const msecs = Num.clamp(0, Num.INFINITY, input);
      if (msecs < MINUTE) return Time.duration(msecs).format({ unit: 's', round: 0 });
      if (msecs < HOUR) return Time.duration(msecs).format({ unit: 'm', round: 0 });
      if (msecs < 2 * DAY) return Time.duration(msecs).format({ unit: 'h', round: 0 });
      return Time.duration(msecs).format({ unit: 'd', round: 0 });
    },

    note(text: string): string {
      return text ? c.gray(c.italic(`  ${text}`)) : '';
    },
  } as const,
);

const wrangle = {
  decisions(upgrade: t.WorkspaceUpgrade.Result): ReadonlyMap<string, t.EsmPolicy.Decision> {
    return new Map(
      upgrade.policy.decisions.map(
        (decision) => [FmtBase.key(decision.input.subject.entry), decision] as const,
      ),
    );
  },

  selected(decision?: t.EsmPolicy.Decision): t.StringSemver | undefined {
    if (!decision?.ok) return undefined;
    return decision.selection.selected?.version;
  },
} as const;
