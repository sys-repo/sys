import { describe, expect, it } from '../../-test.ts';
import { Args } from '../u/u.args.ts';

describe('@sys/workspace/bump args', () => {
  it('parses canonical bump cli args', () => {
    const res = Args.parse(['--from', '@scope/a', '--release', 'minor', '--dry-run']);
    expect(res).to.eql({
      help: undefined,
      from: ['@scope/a'],
      since: undefined,
      release: 'minor',
      dryRun: true,
      nonInteractive: false,
    });
  });

  it('ignores deno task argv separator before bump args', () => {
    const res = Args.parse(['--', '--from', '@scope/a', '--release', 'minor', '--dry-run']);
    expect(res).to.eql({
      help: undefined,
      from: ['@scope/a'],
      since: undefined,
      release: 'minor',
      dryRun: true,
      nonInteractive: false,
    });
  });

  it('normalizes supported release kinds', () => {
    expect(Args.release()).to.eql(undefined);
    expect(Args.release('PATCH')).to.eql('patch');
    expect(Args.release('Minor')).to.eql('minor');
    expect(Args.release('major')).to.eql('major');
  });

  it('rejects unsupported release kinds', () => {
    expect(Args.release('prerelease')).to.eql(undefined);
    expect(Args.release('banana')).to.eql(undefined);
  });

  it('accumulates repeated bump roots from argv', () => {
    const res = Args.parse(['--from', '@scope/a', '--from', 'code/pkg-b']);
    expect(res).to.eql({
      help: undefined,
      from: ['@scope/a', 'code/pkg-b'],
      since: undefined,
      release: undefined,
      dryRun: false,
      nonInteractive: false,
    });
  });

  it('resolves canonical run args from argv, overrides, and policy', () => {
    const policy = { couplings: [] } as const;
    const res = Args.run({
      argv: ['--from', '@scope/a', '--from', 'code/pkg-b', '--release', 'minor', '--dry-run'],
      options: { cwd: '/tmp/workspace', nonInteractive: true },
      policy,
    });

    expect(res).to.eql({
      help: false,
      invalidRelease: undefined,
      since: undefined,
      conflict: undefined,
      run: {
        cwd: '/tmp/workspace',
        release: 'minor',
        from: ['@scope/a', 'code/pkg-b'],
        dryRun: true,
        nonInteractive: true,
        policy,
      },
    });
  });

  it('parses since refs and reports since/from conflicts after help handling', () => {
    const parsed = Args.parse(['--since', 'baseline', '--dry-run']);
    expect(parsed).to.eql({
      help: undefined,
      from: undefined,
      since: 'baseline',
      release: undefined,
      dryRun: true,
      nonInteractive: false,
    });

    const missingRef = Args.run({ argv: ['--since'] });
    expect(missingRef.since).to.eql('');
    expect(missingRef.conflict).to.eql(undefined);

    const conflict = Args.run({ argv: ['--since', 'baseline', '--from', '@scope/a'] });
    expect(conflict.conflict).to.eql({
      code: 'since-and-from',
      message: '--since cannot be used with --from.',
    });

    const missingConflict = Args.run({ argv: ['--since', '--from', '@scope/a'] });
    expect(missingConflict.conflict?.code).to.eql('since-and-from');

    const help = Args.run({ argv: ['--help', '--since', 'baseline', '--from', '@scope/a'] });
    expect(help.help).to.eql(true);
    expect(help.conflict).to.eql(undefined);
  });
});
