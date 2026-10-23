import { describe, expect, it, type t } from '../../-test.ts';
import { Standdown, type StanddownInput } from '../u.standdown.ts';
import { StanddownTime } from '../u.standdown.time.ts';
import { standdownTime as T } from './u.fixture.ts';

type EvidenceCase = readonly [
  string,
  unknown,
  t.WorkspaceUpgrade.VersionEligibility['kind'],
  boolean?,
];
const cases: readonly EvidenceCase[] = [
  ['mature', T.older, 'eligible', true],
  ['young', T.tooNew, 'standdown', true],
  ['cutoff', '2026-06-26T00:00:00.000Z', 'eligible', true],
  ['before cutoff', '2026-06-25T23:59:59.999Z', 'eligible', true],
  ['after cutoff', '2026-06-26T00:00:00.001Z', 'standdown', true],
  ['offset', '2026-06-26T01:00:00+01:00', 'eligible', true],
  ['negative offset', '2026-06-25T23:00:00-01:00', 'eligible', true],
  ['native fractional seconds', '2026-06-25T23:59:59.999999Z', 'eligible', true],
  ['future', '2026-06-29T00:00:00Z', 'unknown-published-at', true],
  ['epoch', '1970-01-01T00:00:00Z', 'eligible', true],
  ['leap day', '2024-02-29T00:00:00Z', 'eligible', true],
  ['missing', undefined, 'unknown-published-at'],
  ['null', null, 'unknown-published-at'],
  ['number', 0, 'unknown-published-at'],
  ['object', {}, 'unknown-published-at'],
  ['invalid', 'not a date', 'unknown-published-at'],
  ['date only', '2026-06-25', 'unknown-published-at'],
  ['local time', '2026-06-25T00:00:00', 'unknown-published-at'],
  ['lowercase', '2026-06-25t00:00:00z', 'unknown-published-at'],
  ['no seconds', '2026-06-25T00:00Z', 'unknown-published-at'],
  ['basic offset', '2026-06-25T00:00:00+0000', 'unknown-published-at'],
  ['whitespace', ' 2026-06-25T00:00:00Z', 'unknown-published-at'],
  ['trailing data', '2026-06-25T00:00:00Zjunk', 'unknown-published-at'],
  // End-of-input bytes are part of strict publication validation.
  ['trailing newline', '2026-06-25T00:00:00Z\n', 'unknown-published-at'],
  ['bad timezone', '2026-06-25T00:00:00+bad', 'unknown-published-at'],
  ['offset hour', '2026-06-25T00:00:00+24:00', 'unknown-published-at'],
  ['offset minute', '2026-06-25T00:00:00+00:60', 'unknown-published-at'],
  ['invalid leap day', '2026-02-29T00:00:00Z', 'unknown-published-at'],
  ['century', '1900-02-29T00:00:00Z', 'unknown-published-at'],
  ['month', '2026-13-01T00:00:00Z', 'unknown-published-at'],
  ['day', '2026-04-31T00:00:00Z', 'unknown-published-at'],
  ['hour', '2026-06-25T24:00:00Z', 'unknown-published-at'],
  ['minute', '2026-06-25T00:60:00Z', 'unknown-published-at'],
  ['second', '2026-06-25T00:00:60Z', 'unknown-published-at'],
];

describe('Workspace.Upgrade standdown parity', () => {
  for (const registry of ['npm', 'jsr'] as const) {
    const native = registry === 'npm' ? 'publishedAt' : 'createdAt';
    const wrong = registry === 'npm' ? 'createdAt' : 'publishedAt';
    const input = (source: unknown, options: Partial<StanddownInput> = {}): StanddownInput => ({
      registry,
      current: '1.0.0',
      available: ['2.0.0'],
      versions: { '2.0.0': { [native]: source, [wrong]: T.older } },
      evaluatedAt: T.now,
      minimumDependencyAge: 2 * T.day,
      ...options,
    });

    for (const [label, source, kind, valid] of cases) {
      it(`${registry}: ${label} uses only native evidence`, () => {
        const result = Standdown.evaluate(input(source));
        expect(result.versions[0].eligibility.kind).to.eql(kind);
        expect(result.versions[0].publishedAt).to.eql(valid ? source : undefined);
        expect(result.eligible).to.eql(kind === 'eligible' ? ['2.0.0'] : []);
        if (kind === 'standdown') {
          const published = StanddownTime.publication(source)!;
          expect(result.versions[0].eligibility).to.eql({
            kind: 'standdown',
            eligibleAt: published + 2 * T.day,
            age: T.now - published,
          });
        }
      });
    }

    it(`${registry}: zero/current exceptions precede evidence and unused arithmetic`, () => {
      for (const source of [undefined, 'invalid', T.tooNew, '2026-06-29T00:00:00Z', T.older]) {
        const zero = Standdown.evaluate(input(source, { minimumDependencyAge: 0 }));
        const current = Standdown.evaluate(input(source, {
          current: '2.0.0',
          minimumDependencyAge: Number.MAX_SAFE_INTEGER,
        }));
        expect(zero.eligible).to.eql(['2.0.0']);
        expect(current.eligible).to.eql(['2.0.0']);
      }
      expect(Standdown.evaluate(input(undefined, { available: [] }))).to.eql({
        eligible: [],
        versions: [],
      });
    });

    it(`${registry}: checks necessary deadlines without masking evidence errors`, () => {
      for (const source of [undefined, 'invalid', '2026-06-29T00:00:00Z']) {
        const result = Standdown.evaluate(input(source, {
          minimumDependencyAge: Number.MAX_SAFE_INTEGER,
        }));
        expect(result.versions[0].eligibility.kind).to.eql('unknown-published-at');
      }
      expect(() =>
        Standdown.evaluate(input(T.older, { minimumDependencyAge: Number.MAX_SAFE_INTEGER }))
      ).to.throw('Unsupported dependency standdown deadline');
      const maximum = Standdown.evaluate(input('1970-01-01T00:00:00Z', {
        minimumDependencyAge: StanddownTime.maxTimestamp,
        evaluatedAt: StanddownTime.maxTimestamp,
      }));
      expect(maximum.eligible).to.eql(['2.0.0']);
    });

    it(`${registry}: validates options before zero/current exceptions`, () => {
      for (const minimumDependencyAge of [-1, 0.0001, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
        expect(() => Standdown.evaluate(input(T.older, { minimumDependencyAge, current: '2.0.0' })))
          .to.throw('Invalid minimumDependencyAge');
      }
      for (const evaluatedAt of [-1, 0.5, NaN, Infinity, StanddownTime.maxTimestamp + 1]) {
        expect(() => Standdown.evaluate(input(T.older, { minimumDependencyAge: 0, evaluatedAt })))
          .to.throw('Invalid evaluatedAt');
      }
    });
  }
});
