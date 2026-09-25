import { describe, expect, it, Time } from '../../-test.ts';
import { MinimumDependencyAge } from '../u/u.minimumDependencyAge.ts';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const NOW = Time.utc('2026-06-28T00:00:00.000Z').timestamp;

describe('Workspace.Cli args', () => {
  it('parses workspace minimum dependency age inputs', () => {
    expect(MinimumDependencyAge.parse(undefined, NOW)).to.eql(2 * DAY);
    expect(MinimumDependencyAge.parse('0', NOW)).to.eql(0);
    expect(MinimumDependencyAge.parse('2880', NOW)).to.eql(2 * DAY);
    expect(MinimumDependencyAge.parse('P2D', NOW)).to.eql(2 * DAY);
    expect(MinimumDependencyAge.parse('PT48H', NOW)).to.eql(2 * DAY);
    expect(MinimumDependencyAge.parse('2026-06-26', NOW)).to.eql(2 * DAY);
    expect(MinimumDependencyAge.parse('2026-06-26T00:00:00.000Z', NOW)).to.eql(2 * DAY);
    expect(MinimumDependencyAge.parse('2026-06-26T00:00:00+00:00', NOW)).to.eql(2 * DAY);
  });

  it('converts total decimal durations exactly before number conversion', () => {
    const valid = [
      ['PT1.001S', 1001],
      ['PT0.000005M0.0007S', 1],
      ['0.001', 60],
      ['PT0.001S', 1],
      ['P0.5D', DAY / 2],
      ['P1W', 7 * DAY],
      ['PT9007199254740.991S', Number.MAX_SAFE_INTEGER],
    ] as const;
    for (const [input, expected] of valid) {
      expect(MinimumDependencyAge.parse(input, NOW), input).to.eql(expected);
    }
    const invalid = [
      'PT1.0000000000000001S',
      'PT0.0001S',
      'PT9007199254740.992S',
      `PT0.${'0'.repeat(350)}1S`,
      '-1',
      'NaN',
      'Infinity',
      'P',
      'PT',
    ];
    for (const input of invalid) {
      expect(() => MinimumDependencyAge.parse(input, NOW), input).to.throw(
        'Invalid minimum dependency age',
      );
    }
  });

  it('preserves CLI UTC dates and equivalent extended/basic offsets', () => {
    const valid = [
      '2026-06-26',
      '2026-06-26T00:00:00Z',
      '2026-06-26T01:00:00+01:00',
      '2026-06-26T01:00:00+0100',
      '2026-06-25T23:00:00-0100',
      '2026-06-26T00:00Z',
      '2026-06-26T000000Z',
    ];
    for (const input of valid) {
      expect(MinimumDependencyAge.parse(input, NOW), input).to.eql(2 * DAY);
    }
    expect(MinimumDependencyAge.parse('1970-01-01', 0)).to.eql(0);
    const invalid = [
      '2026-02-29',
      '2026-06-26T00:00:00',
      '2026-06-26T00:00:00+2460',
      '2026-06-26T00:00:00+00:60',
      '2026-06-26T00:00:00+010',
      '2026-06-26T00:00:00+01:00junk',
      '2026-06-26T24:00:00Z',
    ];
    for (const input of invalid) {
      expect(() => MinimumDependencyAge.parse(input, NOW), input).to.throw(
        'Invalid minimum dependency age',
      );
    }
  });

  it('rejects unsupported shorthand minimum dependency age inputs', () => {
    let message = '';
    try {
      MinimumDependencyAge.parse('24h', NOW);
    } catch (error) {
      message = (error as { message?: string }).message ?? String(error);
    }

    expect(message).to.include('Invalid minimum dependency age: 24h');
  });
});
