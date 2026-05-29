import { describe, expect, it } from '../../-test.ts';
import { Args } from '../u/u.args.ts';

describe('@sys/workspace/bump args', () => {
  describe('parse', () => {
    it('parses canonical bump cli args', () => {
      const res = Args.parse(['--from', '@scope/a', '--release', 'minor', '--dry-run']);

      expect(res).to.eql({
        help: undefined,
        from: ['@scope/a'],
        since: undefined,
        release: 'minor',
        dryRun: true,
        nonInteractive: false,
        explainDelta: false,
      });
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
        explainDelta: false,
      });
    });

    it('ignores deno task argv separators around bump args', () => {
      const res = Args.parse(['--', '--from', '@scope/a', '--release', 'minor', '--dry-run']);

      expect(res.from).to.eql(['@scope/a']);
      expect(res.release).to.eql('minor');
      expect(res.dryRun).to.eql(true);
    });

    it('accepts argv separators after baked-in task args', () => {
      const res = Args.parse(['--since', 'baseline', '--dry-run', '--', '--explain-delta']);

      expect(res.since).to.eql('baseline');
      expect(res.dryRun).to.eql(true);
      expect(res.explainDelta).to.eql(true);
    });
  });

  describe('release', () => {
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
  });

  describe('run', () => {
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
        explainDelta: false,
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

    it('passes since refs through to the cli edge', () => {
      const parsed = Args.parse(['--since', 'baseline', '--dry-run']);
      const run = Args.run({ argv: ['--since', 'baseline', '--dry-run'] });

      expect(parsed.since).to.eql('baseline');
      expect(run.since).to.eql('baseline');
      expect(run.run.dryRun).to.eql(true);
    });

    it('treats missing since values as a runtime ref error, not an arg conflict', () => {
      const res = Args.run({ argv: ['--since'] });

      expect(res.since).to.eql('');
      expect(res.conflict).to.eql(undefined);
    });

    it('reports since/from conflicts after help handling', () => {
      const conflict = Args.run({ argv: ['--since', 'baseline', '--from', '@scope/a'] });
      const missingConflict = Args.run({ argv: ['--since', '--from', '@scope/a'] });
      const help = Args.run({ argv: ['--help', '--since', 'baseline', '--from', '@scope/a'] });

      expect(conflict.conflict).to.eql({
        code: 'since-and-from',
        message: '--since cannot be used with --from.',
      });
      expect(missingConflict.conflict?.code).to.eql('since-and-from');
      expect(help.conflict).to.eql(undefined);
    });

    it('passes explain-delta through when since is present', () => {
      const parsed = Args.parse(['--since', 'baseline', '--explain-delta']);
      const run = Args.run({ argv: ['--since', 'baseline', '--explain-delta'] });

      expect(parsed.explainDelta).to.eql(true);
      expect(run.explainDelta).to.eql(true);
      expect(run.conflict).to.eql(undefined);
    });

    it('requires since when explain-delta is present', () => {
      const res = Args.run({ argv: ['--explain-delta'] });

      expect(res.conflict).to.eql({
        code: 'explain-delta-without-since',
        message: '--explain-delta requires --since.',
      });
    });
  });
});
