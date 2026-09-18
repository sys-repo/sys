import { describe, expect, it, Time } from '../../-test.ts';
import { MinimumDependencyAge } from '../u/u.minimumDependencyAge.ts';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const NOW = Time.utc('2026-06-28T00:00:00.000Z').timestamp;

describe('Workspace.Cli args', () => {
  it('parses Deno-compatible minimum dependency age inputs', () => {
    expect(MinimumDependencyAge.parse(undefined, NOW)).to.eql(2 * DAY);
    expect(MinimumDependencyAge.parse('0', NOW)).to.eql(0);
    expect(MinimumDependencyAge.parse('2880', NOW)).to.eql(2 * DAY);
    expect(MinimumDependencyAge.parse('P2D', NOW)).to.eql(2 * DAY);
    expect(MinimumDependencyAge.parse('PT48H', NOW)).to.eql(2 * DAY);
    expect(MinimumDependencyAge.parse('2026-06-26', NOW)).to.eql(2 * DAY);
    expect(MinimumDependencyAge.parse('2026-06-26T00:00:00.000Z', NOW)).to.eql(2 * DAY);
    expect(MinimumDependencyAge.parse('2026-06-26T00:00:00+00:00', NOW)).to.eql(2 * DAY);
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
