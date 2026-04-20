import { describe, expect, it } from '../../-test.ts';
import { Args } from '../u.args.ts';

describe('@sys/workspace/bump args', () => {
  it('parses canonical bump cli args', () => {
    const res = Args.parse(['--from', '@scope/a', '--release', 'minor', '--dry-run']);
    expect(res).to.eql({
      help: undefined,
      from: '@scope/a',
      release: 'minor',
      dryRun: true,
      nonInteractive: false,
    });
  });

  it('ignores deno task argv separator before bump args', () => {
    const res = Args.parse(['--', '--from', '@scope/a', '--release', 'minor', '--dry-run']);
    expect(res).to.eql({
      help: undefined,
      from: '@scope/a',
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

  it('resolves canonical run args from argv, overrides, and policy', () => {
    const policy = { couplings: [] } as const;
    const res = Args.run({
      argv: ['--from', '@scope/a', '--release', 'minor', '--dry-run'],
      options: { cwd: '/tmp/workspace', nonInteractive: true },
      policy,
    });

    expect(res).to.eql({
      help: false,
      invalidRelease: undefined,
      run: {
        cwd: '/tmp/workspace',
        release: 'minor',
        from: '@scope/a',
        dryRun: true,
        nonInteractive: true,
        policy,
      },
    });
  });
});
