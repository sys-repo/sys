import { describe, expect, it, Json, type t } from '../../-test.ts';
import {
  classifyPackageResolutionFailure,
  packageResolutionFromInfo,
  resolvePackage,
} from '../u.package.ts';
import { invokeOutput, minimumDependencyPolicy } from './u.fixture.ts';

describe('Workspace.Resolve', () => {
  describe('packageResolutionFromInfo', () => {
    it('normalizes a jsr package version from deno info packages', () => {
      const fact = packageResolutionFromInfo('jsr:@test/root', {
        packages: {
          '@test/root@*': '@test/root@0.0.457',
        },
      });

      expect(fact).to.eql({
        ok: true,
        specifier: 'jsr:@test/root',
        registry: 'jsr',
        package: '@test/root',
        resolved: '0.0.457',
      });
    });

    it('prefers the exact requested package fact when multiple versions are present', () => {
      const fact = packageResolutionFromInfo('jsr:@test/root@0.0.460', {
        packages: {
          '@test/root@^0.0.400': '@test/root@0.0.457',
          '@test/root@0.0.460': '@test/root@0.0.460',
        },
      });

      expect(fact).to.eql({
        ok: true,
        specifier: 'jsr:@test/root@0.0.460',
        registry: 'jsr',
        package: '@test/root',
        resolved: '0.0.460',
      });
    });

    it('fails closed when package facts contain multiple versions without an exact root fact', () => {
      const fact = packageResolutionFromInfo('jsr:@test/root@^0.0.450', {
        packages: {
          '@test/root@^0.0.400': '@test/root@0.0.457',
          '@test/root@^0.0.430': '@test/root@0.0.460',
        },
      });

      expect(fact).to.eql({
        ok: false,
        specifier: 'jsr:@test/root@^0.0.450',
        registry: 'jsr',
        package: '@test/root',
        reason: {
          code: 'unknown',
          message:
            'Deno info reported multiple resolved versions for @test/root without an exact root package fact',
        },
      });
    });

    it('normalizes a scoped npm package version from deno info packages', () => {
      const fact = packageResolutionFromInfo('npm:@test/root', {
        packages: {
          '@test/root@*': '@test/root@8.18.1',
        },
      });

      expect(fact).to.eql({
        ok: true,
        specifier: 'npm:@test/root',
        registry: 'npm',
        package: '@test/root',
        resolved: '8.18.1',
      });
    });

    it('falls back to jsr redirects when package facts are absent', () => {
      const fact = packageResolutionFromInfo('jsr:@test/root', {
        redirects: {
          'jsr:@test/root': 'https://jsr.io/@test/root/0.0.457/src/mod.ts',
        },
      });

      expect(fact).to.eql({
        ok: true,
        specifier: 'jsr:@test/root',
        registry: 'jsr',
        package: '@test/root',
        resolved: '0.0.457',
      });
    });

    it('uses the exact requested-specifier error when deno roots are absent', () => {
      const fact = packageResolutionFromInfo('jsr:@test/root', {
        modules: [
          {
            specifier: 'jsr:@test/root',
            error: minimumDependencyPolicy.error,
          },
        ],
      });

      expect(fact).to.eql({
        ok: false,
        specifier: 'jsr:@test/root',
        registry: 'jsr',
        package: '@test/root',
        reason: {
          code: 'policy:minimum-dependency-age',
          message: minimumDependencyPolicy.error,
          minimumDependencyDate: minimumDependencyPolicy.cutoff,
        },
      });
    });

    it('preserves an explicit root package fact despite an unrelated graph error', () => {
      const fact = packageResolutionFromInfo('jsr:@test/root', {
        roots: ['jsr:@test/root'],
        packages: { '@test/root@*': '@test/root@0.0.457' },
        modules: [
          {
            specifier: 'https://example.test/transitive.ts',
            error: 'Unrelated graph error',
          },
        ],
      });

      expect(fact).to.eql({
        ok: true,
        specifier: 'jsr:@test/root',
        registry: 'jsr',
        package: '@test/root',
        resolved: '0.0.457',
      });
    });

    it('fails closed on a root error with a package fact regardless of module order', () => {
      const unrelated = {
        specifier: 'https://example.test/transitive.ts',
        error: 'Unrelated graph error',
      };
      const root = {
        specifier: 'jsr:@test/root',
        error: 'Requested root failed',
      };
      const expected = {
        ok: false,
        specifier: 'jsr:@test/root',
        registry: 'jsr',
        package: '@test/root',
        reason: { code: 'unknown', message: root.error },
      };

      for (const modules of [[unrelated, root], [root, unrelated]]) {
        const fact = packageResolutionFromInfo('jsr:@test/root', {
          roots: ['jsr:@test/root'],
          packages: { '@test/root@*': '@test/root@0.0.457' },
          modules,
        });
        expect(fact).to.eql(expected);
      }
    });

    it('treats an empty root error as a resolver failure', () => {
      const fact = packageResolutionFromInfo('jsr:@test/root', {
        roots: ['jsr:@test/root'],
        packages: { '@test/root@*': '@test/root@0.0.457' },
        modules: [{ specifier: 'jsr:@test/root', error: '' }],
      });

      expect(fact).to.eql({
        ok: false,
        specifier: 'jsr:@test/root',
        registry: 'jsr',
        package: '@test/root',
        reason: { code: 'unknown', message: 'Deno package resolution failed' },
      });
    });
  });

  describe('classifyPackageResolutionFailure', () => {
    it('extracts the minimum dependency date from a policy diagnostic', () => {
      const reason = classifyPackageResolutionFailure(minimumDependencyPolicy.error);

      expect(reason).to.eql({
        code: 'policy:minimum-dependency-age',
        message: minimumDependencyPolicy.error,
        minimumDependencyDate: minimumDependencyPolicy.cutoff,
      });
    });

    it('preserves policy classification when no dependency date is present', () => {
      const error = 'Resolution blocked by the minimum dependency age policy';
      const reason = classifyPackageResolutionFailure(error);

      expect(reason).to.eql({
        code: 'policy:minimum-dependency-age',
        message: error,
      });
    });
  });

  describe('resolvePackage', () => {
    it('uses the owned deno info boundary when resolving packages', async () => {
      const calls: t.Process.InvokeArgs[] = [];

      const fact = await resolvePackage(
        {
          cwd: '/workspace/root' as t.StringDir,
          specifier: 'jsr:@test/root',
          reload: true,
        },
        {
          invoke: (args) => {
            calls.push(args);
            return invokeOutput({
              success: true,
              stdout: Json.stringify({
                packages: { '@test/root@*': '@test/root@0.0.457' },
              }),
            });
          },
        },
      );

      expect(calls).to.eql([
        {
          cmd: 'deno',
          cwd: '/workspace/root',
          args: ['info', '--json', '--reload', 'jsr:@test/root'],
          silent: true,
        },
      ]);
      expect(fact).to.eql({
        ok: true,
        specifier: 'jsr:@test/root',
        registry: 'jsr',
        package: '@test/root',
        resolved: '0.0.457',
      });
    });

    it('can isolate a package probe from auto-discovered config and lockfiles', async () => {
      const calls: t.Process.InvokeArgs[] = [];

      const fact = await resolvePackage(
        {
          cwd: '/workspace/root' as t.StringDir,
          specifier: 'jsr:@test/root@0.0.462',
          reload: true,
          noConfig: true,
          noLock: true,
        },
        {
          invoke: (args) => {
            calls.push(args);
            return invokeOutput({
              success: true,
              stdout: Json.stringify({
                packages: { '@test/root@0.0.462': '@test/root@0.0.462' },
              }),
            });
          },
        },
      );

      expect(calls).to.eql([
        {
          cmd: 'deno',
          cwd: '/workspace/root',
          args: [
            'info',
            '--json',
            '--no-config',
            '--no-lock',
            '--reload',
            'jsr:@test/root@0.0.462',
          ],
          silent: true,
        },
      ]);
      expect(fact).to.eql({
        ok: true,
        specifier: 'jsr:@test/root@0.0.462',
        registry: 'jsr',
        package: '@test/root',
        resolved: '0.0.462',
      });
    });

    it('reads a root policy error from successful deno info json', async () => {
      const fact = await resolvePackage(
        {
          cwd: '/workspace/root' as t.StringDir,
          specifier: 'jsr:@test/root',
        },
        {
          invoke: () =>
            invokeOutput({
              success: true,
              stdout: Json.stringify({
                roots: ['jsr:@test/root'],
                modules: [
                  {
                    specifier: 'jsr:@test/root',
                    error: minimumDependencyPolicy.error,
                  },
                ],
                redirects: {},
                packages: {},
              }),
            }),
        },
      );

      expect(fact).to.eql({
        ok: false,
        specifier: 'jsr:@test/root',
        registry: 'jsr',
        package: '@test/root',
        reason: {
          code: 'policy:minimum-dependency-age',
          message: minimumDependencyPolicy.error,
          minimumDependencyDate: minimumDependencyPolicy.cutoff,
        },
      });
    });

    it('fails closed when consumed deno info roots drift', async () => {
      const fact = await resolvePackage(
        {
          cwd: '/workspace/root' as t.StringDir,
          specifier: 'jsr:@test/root',
        },
        {
          invoke: () =>
            invokeOutput({
              success: true,
              stdout: Json.stringify({
                roots: [123],
                packages: { '@test/root@*': '@test/root@0.0.457' },
              }),
            }),
        },
      );

      expect(fact).to.eql({
        ok: false,
        specifier: 'jsr:@test/root',
        registry: 'jsr',
        package: '@test/root',
        reason: {
          code: 'unknown',
          message: 'Deno info field "roots" must be an array of strings',
        },
      });
    });
  });
});
