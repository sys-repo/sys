import { describe, expect, it } from '../../-test.ts';
import { Args, parseArgs } from '../mod.ts';

type O = Record<string, unknown>;

/**
 * Assertions verifying that the examples documented in `./t.ts`
 * behave exactly as described.
 *
 * These tests operate at the *user-contract* level.
 */
describe('Args: (docs)', () => {
  it('Basic usage', () => {
    const argv = ['-v', '--port', '3000', 'serve', 'site'];
    const a = Args.parse(argv);
    const b = parseArgs(argv);

    expect(a.v).to.eql(true);
    expect(a.port).to.eql(3000);
    expect(a._).to.eql(['serve', 'site']);
    expect(b).to.eql(a);
  });

  it('Aliases (bi-directional, write-time accumulation)', () => {
    const argv = ['-h', '--name=Phil', '-n', 'PJ'];
    const options = { alias: { h: 'help', n: ['name', 'nick'] } };

    const res = Args.parse(argv, options);

    expect(res.h).to.eql(true);
    expect(res.help).to.eql(true);

    // name written twice → accumulates
    expect(res.name).to.eql(['Phil', 'PJ']);

    // n mirrors name writes → accumulates
    expect(res.n).to.eql(['Phil', 'PJ']);

    // nick written once → scalar
    expect(res.nick).to.eql('PJ');
  });

  it('Booleans, strings, and numeric coercion', () => {
    const argv = ['--dry-run', '--port', '3000', '--id', '007'];
    const res = Args.parse(argv, {
      boolean: ['dry-run'],
      string: ['id'] as const,
    });

    expect(res['dry-run']).to.eql(true);
    expect(res.port).to.eql(3000);
    expect(res.id).to.eql('007');
  });

  it('Short clusters: -abc', () => {
    const res = Args.parse(['-abc']);
    expect(res.a).to.eql(true);
    expect(res.b).to.eql(true);
    expect(res.c).to.eql(true);
    expect(res._).to.eql([]);
  });

  it('Numeric tails: -n5 (inline)', () => {
    const res = Args.parse(['-n5']);
    expect(res.n).to.eql(5);
    expect(res._).to.eql([]);
  });

  it('Numeric tails: -n 5 (next token)', () => {
    const res = Args.parse(['-n', '5']);
    expect(res.n).to.eql(5);
    expect(res._).to.eql([]);
  });

  it('“--” terminator', () => {
    const res = Args.parse(['--name', 'x', '--', '--kept', '-z']);
    expect(res.name).to.eql('x');
    expect(res._).to.eql(['--kept', '-z']);
  });

  it('stopEarly: first positional binds value and stops parse', () => {
    const res = Args.parse(['--flag', 'pos1', '--also', 'x', 'pos2'], { stopEarly: true });

    expect(res.flag).to.eql('pos1');
    expect(res._).to.eql(['pos2']);
  });

  it('Defaults and repeated flags (accumulation, mirrored to aliases)', () => {
    const res = Args.parse(['--tag', 'a', '--tag', 'b'], {
      default: { retries: 3 },
      alias: { t: 'tag' },
    });

    expect(res.tag).to.eql(['a', 'b']);
    expect(res.t).to.eql(['a', 'b']);
    expect(res.retries).to.eql(3);
  });

  it('Rejecting unknown flags via `unknown` hook', () => {
    const res = Args.parse(['--good', '1', '--bad', 'x'], {
      unknown: (raw) => raw === '--good' || raw === '-g',
    });
    expect(res.good).to.eql(1);
    expect((res as O).bad).to.eql(undefined);
    expect(res._).to.eql([]);
  });
});
