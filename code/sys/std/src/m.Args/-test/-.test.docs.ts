import { describe, expect, it } from '../../-test.ts';
import { Args, parseArgs } from '../mod.ts';

/**
 * Assertions verifying that the examples documented in `./t.ts`
 * behave exactly as described.
 */
describe('Args: (docs)', () => {
  it('Basic usage', () => {
    const argv = ['-v', '--port', '3000', 'serve', 'site'];

    const a = Args.parse(argv);
    const b = parseArgs(argv);

    // Shape checks
    expect(a.v).to.equal(true);
    expect(a.port).to.equal(3000);
    expect(a._).to.eql(['serve', 'site']);

    // `Args.parse` and `parseArgs` parity
    expect(b).to.eql(a);
  });

  it('Aliases (bi-directional)', () => {
    const argv = ['-h', '--name=Phil', '-n', 'PJ'];
    const options = { alias: { h: 'help', n: ['name', 'nick'] } };

    const res = Args.parse(argv, options);

    // h/help
    expect(res.h).to.equal(true);
    expect(res.help).to.equal(true);

    // n/name/nick resolve to the last provided value
    expect(res.n).to.equal('PJ');
    expect(res.name).to.equal('PJ');
    expect(res.nick).to.equal('PJ');
  });

  it('Booleans, strings, and numeric coercion', () => {
    const argv = ['--dry-run', '--port', '3000', '--id', '007'];
    const options = { boolean: ['dry-run'], string: ['id'] as const };

    const res = Args.parse(argv, options);

    expect(res['dry-run']).to.equal(true);
    expect(res.port).to.equal(3000); // numeric
    expect(res.id).to.equal('007'); // preserved as string
  });

  it('Short clusters and numeric tails: -abc', () => {
    const res = Args.parse(['-abc']);
    expect(res.a).to.equal(true);
    expect(res.b).to.equal(true);
    expect(res.c).to.equal(true);
    expect(res._).to.eql([]);
  });

  it('Short clusters and numeric tails: -n5 (inline)', () => {
    const res = Args.parse(['-n5']);
    expect(res.n).to.equal(5);
    expect(res._).to.eql([]);
  });

  it('Short clusters and numeric tails: -n 5 (next token)', () => {
    const res = Args.parse(['-n', '5']);
    expect(res.n).to.equal(5);
    expect(res._).to.eql([]);
  });

  it('“--” terminator', () => {
    const res = Args.parse(['--name', 'x', '--', '--kept', '-z']);
    expect(res.name).to.equal('x');
    expect(res._).to.eql(['--kept', '-z']);
  });

  it('stopEarly: after first positional, treat all as positional', () => {
    const res = Args.parse(['--flag', 'pos1', '--also', 'x', 'pos2'], { stopEarly: true });
    expect(res.flag).to.equal(true);
    expect(res._).to.eql(['pos1', '--also', 'x', 'pos2']);
  });

  it('Defaults and repeated flags (accumulation, mirrored to aliases)', () => {
    const res = Args.parse(['--tag', 'a', '--tag', 'b'], {
      default: { retries: 3 },
      alias: { t: 'tag' },
    });

    // Repeated flags accumulate
    expect(res.tag).to.eql(['a', 'b']);

    // Mirrored onto alias; do deep equality (not identity)
    expect(res.t).to.eql(['a', 'b']);

    // Default applied when not present
    expect(res.retries).to.equal(3);
  });

  it('Rejecting unknown flags via `unknown` hook', () => {
    const res = Args.parse(['--good', '1', '--bad', 'x'], {
      unknown: (raw) => raw === '--good' || raw === '-g',
    });

    expect(res.good).to.equal(1);
    expect((res as Record<string, unknown>).bad).to.equal(undefined);
    expect(res._).to.eql([]);
  });
});
