import { describe, expect, it, type t } from '../../-test.ts';
import { WorkspaceResolve } from '../mod.ts';
import {
  classifyPackageResolutionFailure,
  packageResolutionFromInfo,
  resolvePackage,
} from '../u.package.ts';

describe('Workspace.Resolve', () => {
  describe('API', () => {
    it('exports the resolver namespace', async () => {
      const m = await import('@sys/workspace/resolve');
      expect(m.WorkspaceResolve).to.equal(WorkspaceResolve);
    });
  });

  describe('packageResolutionFromInfo', () => {
    it('normalizes a jsr package version from deno info packages', () => {
      const fact = packageResolutionFromInfo('jsr:@sys/tools', {
        packages: {
          '@sys/tools@*': '@sys/tools@0.0.457',
        },
      });

      expect(fact).to.eql({
        ok: true,
        specifier: 'jsr:@sys/tools',
        registry: 'jsr',
        package: '@sys/tools',
        resolved: '0.0.457',
      });
    });

    it('prefers the exact requested package fact when multiple versions are present', () => {
      const fact = packageResolutionFromInfo('jsr:@sys/tools@0.0.460', {
        packages: {
          '@sys/tools@^0.0.400': '@sys/tools@0.0.457',
          '@sys/tools@0.0.460': '@sys/tools@0.0.460',
        },
      });

      expect(fact).to.eql({
        ok: true,
        specifier: 'jsr:@sys/tools@0.0.460',
        registry: 'jsr',
        package: '@sys/tools',
        resolved: '0.0.460',
      });
    });

    it('fails closed when package facts contain multiple versions without an exact root fact', () => {
      const fact = packageResolutionFromInfo('jsr:@sys/tools@^0.0.450', {
        packages: {
          '@sys/tools@^0.0.400': '@sys/tools@0.0.457',
          '@sys/tools@^0.0.430': '@sys/tools@0.0.460',
        },
      });

      expect(fact.ok).to.eql(false);
      if (!fact.ok) {
        expect(fact.reason.code).to.eql('unknown');
        expect(fact.reason.message).to.include('multiple resolved versions');
      }
    });

    it('normalizes a scoped npm package version from deno info packages', () => {
      const fact = packageResolutionFromInfo('npm:@types/ws', {
        packages: {
          '@types/ws@*': '@types/ws@8.18.1',
        },
      });

      expect(fact).to.eql({
        ok: true,
        specifier: 'npm:@types/ws',
        registry: 'npm',
        package: '@types/ws',
        resolved: '8.18.1',
      });
    });

    it('falls back to jsr redirects when package facts are absent', () => {
      const fact = packageResolutionFromInfo('jsr:@sys/tools', {
        redirects: {
          'jsr:@sys/tools': 'https://jsr.io/@sys/tools/0.0.457/src/mod.ts',
        },
      });

      expect(fact).to.eql({
        ok: true,
        specifier: 'jsr:@sys/tools',
        registry: 'jsr',
        package: '@sys/tools',
        resolved: '0.0.457',
      });
    });
  });

  describe('classifyPackageResolutionFailure', () => {
    it('classifies minimum dependency age diagnostics without computing policy locally', () => {
      const reason = classifyPackageResolutionFailure({
        stderr:
          'A newer matching version was found, but it was not used because it was newer than the specified minimum dependency date of 2026-06-29 20:24:09 UTC',
        stdout: '',
      });

      expect(reason.code).to.eql('policy:minimum-dependency-age');
      expect(reason.message).to.include('minimum dependency date');
    });
  });

  describe('resolvePackage', () => {
    it('uses the owned deno info boundary when resolving packages', async () => {
      const calls: t.Process.InvokeArgs[] = [];

      const fact = await resolvePackage(
        {
          cwd: '/workspace/root' as t.StringDir,
          specifier: 'jsr:@sys/tools',
          reload: true,
        },
        {
          invoke: async (args) => {
            calls.push(args);
            return output({
              success: true,
              stdout: JSON.stringify({
                packages: { '@sys/tools@*': '@sys/tools@0.0.457' },
              }),
            });
          },
        },
      );

      expect(calls).to.eql([
        {
          cmd: 'deno',
          cwd: '/workspace/root',
          args: ['info', '--json', '--reload', 'jsr:@sys/tools'],
          silent: true,
        },
      ]);
      expect(fact.ok).to.eql(true);
      if (fact.ok) expect(fact.resolved).to.eql('0.0.457');
    });
  });
});

function output(args: { success: boolean; stdout?: string; stderr?: string }): t.Process.Output {
  return {
    code: args.success ? 0 : 1,
    success: args.success,
    signal: null,
    stdout: new TextEncoder().encode(args.stdout ?? ''),
    stderr: new TextEncoder().encode(args.stderr ?? ''),
    text: { stdout: args.stdout ?? '', stderr: args.stderr ?? '' },
    toString() {
      return [args.stdout, args.stderr].filter(Boolean).join('\n');
    },
  };
}
