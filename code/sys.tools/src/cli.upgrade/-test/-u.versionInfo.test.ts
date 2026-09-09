import { describe, expect, expectError, it, type t } from '../../-test.ts';
import { pkg } from '../common.ts';
import { getVersionInfo } from '../u.ts';
import { resolvePublicToolsPackage } from '../u.versionInfo.ts';
import { toVersionState } from '../u.versionState.ts';
import { versionsFailure, versionsMalformed, versionsSuccess } from './u.fixture.ts';

describe('cli.upgrade.versionState', () => {
  it('derives pending when a newer published version is not actionable yet', () => {
    const state = toVersionState({
      local: '0.0.318' as t.StringSemver,
      remote: '9.9.9' as t.StringSemver,
      latest: '0.0.318' as t.StringSemver,
      actionable: '0.0.318' as t.StringSemver,
    });

    expect(state.status).to.eql('pending');
    expect(state.upgradeAvailable).to.eql(false);
    expect(state.pending).to.eql(true);
  });

  it('does not trust a stale upgrade flag without a newer actionable target', () => {
    const state = toVersionState({
      local: '0.0.318' as t.StringSemver,
      remote: '0.0.319' as t.StringSemver,
      latest: '0.0.318' as t.StringSemver,
      actionable: '0.0.318' as t.StringSemver,
      is: { latest: false, upgradeAvailable: true },
    });

    expect(state.status).to.eql('pending');
    expect(state.upgradeAvailable).to.eql(false);
  });

  it('marks resolver-unavailable when Deno cannot verify an actionable target', () => {
    const state = toVersionState({
      local: '0.0.318' as t.StringSemver,
      remote: '0.0.319' as t.StringSemver,
      latest: '0.0.318' as t.StringSemver,
      resolution: {
        ok: false,
        specifier: 'jsr:@sys/tools' as t.StringModuleSpecifier,
        registry: 'jsr',
        package: '@sys/tools' as t.StringPkgName,
        reason: { code: 'registry' },
      },
    });

    expect(state.status).to.eql('resolver-unavailable');
    expect(state.resolverUnavailable).to.eql(true);
    expect(state.actionable).to.eql(undefined);
  });

  it('derives minimum dependency age standdown timing from registry and resolver facts', () => {
    const state = toVersionState({
      local: '0.0.462' as t.StringSemver,
      remote: '0.0.464' as t.StringSemver,
      remoteCreatedAt: '2026-07-05T01:17:43.938610Z' as t.StringTimestamp,
      latest: '0.0.462' as t.StringSemver,
      actionable: '0.0.462' as t.StringSemver,
      latestResolution: {
        ok: false,
        specifier: 'jsr:@sys/tools@0.0.464' as t.StringModuleSpecifier,
        registry: 'jsr',
        package: '@sys/tools' as t.StringPkgName,
        reason: {
          code: 'policy:minimum-dependency-age',
          minimumDependencyDate: '2026-07-04T04:32:25.677189Z' as t.StringTimestamp,
        },
      },
    });

    expect(state.status).to.eql('pending');
    expect(state.minimumDependencyAgeStanddown).to.eql({
      version: '0.0.464',
      createdAt: '2026-07-05T01:17:43.938610Z',
      minimumDependencyDate: '2026-07-04T04:32:25.677189Z',
      remaining: 74_718_261,
    });
  });

  it('preserves latest standdown timing while an intermediate upgrade is actionable', () => {
    const state = toVersionState({
      local: '0.0.462' as t.StringSemver,
      remote: '0.0.464' as t.StringSemver,
      remoteCreatedAt: '2026-07-05T01:17:43.938610Z' as t.StringTimestamp,
      latest: '0.0.463' as t.StringSemver,
      actionable: '0.0.463' as t.StringSemver,
      latestResolution: {
        ok: false,
        specifier: 'jsr:@sys/tools@0.0.464' as t.StringModuleSpecifier,
        registry: 'jsr',
        package: '@sys/tools' as t.StringPkgName,
        reason: {
          code: 'policy:minimum-dependency-age',
          minimumDependencyDate: '2026-07-04T04:32:25.677189Z' as t.StringTimestamp,
        },
      },
    });

    expect(state.status).to.eql('upgrade-available');
    expect(state.actionable).to.eql('0.0.463');
    expect(state.minimumDependencyAgeStanddown).to.eql({
      version: '0.0.464',
      createdAt: '2026-07-05T01:17:43.938610Z',
      minimumDependencyDate: '2026-07-04T04:32:25.677189Z',
      remaining: 74_718_261,
    });
  });

  it('omits standdown timing unless both registry and resolver facts are present', () => {
    const state = toVersionState({
      local: '0.0.462' as t.StringSemver,
      remote: '0.0.464' as t.StringSemver,
      latest: '0.0.462' as t.StringSemver,
      actionable: '0.0.462' as t.StringSemver,
      latestResolution: {
        ok: false,
        specifier: 'jsr:@sys/tools@0.0.464' as t.StringModuleSpecifier,
        registry: 'jsr',
        package: '@sys/tools' as t.StringPkgName,
        reason: { code: 'policy:minimum-dependency-age' },
      },
    });

    expect(state.status).to.eql('pending');
    expect(state.minimumDependencyAgeStanddown).to.eql(undefined);
  });

  it('treats a successful pinned-latest probe as the actionable upgrade target', () => {
    const state = toVersionState({
      local: '0.0.318' as t.StringSemver,
      remote: '0.0.319' as t.StringSemver,
      latest: '0.0.318' as t.StringSemver,
      actionable: '0.0.318' as t.StringSemver,
      latestResolution: {
        ok: true,
        specifier: 'jsr:@sys/tools@0.0.319' as t.StringModuleSpecifier,
        registry: 'jsr',
        package: '@sys/tools' as t.StringPkgName,
        resolved: '0.0.319' as t.StringSemver,
      },
    });

    expect(state.status).to.eql('upgrade-available');
    expect(state.actionable).to.eql('0.0.319');
    expect(state.upgradeAvailable).to.eql(true);
    expect(state.pending).to.eql(false);
  });
});

describe('cli.upgrade.resolvePublicToolsPackage', () => {
  it('resolves the reloaded public tools specifier without workspace config or lock', async () => {
    const calls: Array<{
      readonly cwd: t.StringDir;
      readonly specifier: t.StringModuleSpecifier;
      readonly reload?: boolean;
      readonly noConfig?: boolean;
      readonly noLock?: boolean;
    }> = [];

    const res = await resolvePublicToolsPackage('/workspace/sys' as t.StringDir, {
      reload: true,
      resolvePackage: (args) => {
        calls.push(args);
        return Promise.resolve({
          ok: true as const,
          specifier: args.specifier,
          registry: 'jsr' as const,
          package: '@sys/tools' as t.StringPkgName,
          resolved: '0.0.319' as t.StringSemver,
        });
      },
    });

    expect(res.ok).to.eql(true);
    expect(calls).to.eql([
      {
        cwd: '/workspace/sys',
        specifier: 'jsr:@sys/tools',
        reload: true,
        noConfig: true,
        noLock: true,
      },
    ]);
  });
});

describe('cli.upgrade.getVersionInfo', () => {
  it('rejects unavailable or malformed registry metadata before resolving packages', async () => {
    const resolutions: string[] = [];
    const cases = [
      {
        versions: () => versionsFailure(),
        error: 'Could not retrieve JSR package metadata for @sys/tools: HTTP 503',
      },
      {
        versions: () => versionsMalformed(undefined),
        error: 'Could not retrieve JSR package metadata for @sys/tools: empty response',
      },
      {
        versions: () => versionsMalformed({ scope: 'sys', name: 'tools', versions: {} }),
        error: 'Could not retrieve JSR package metadata for @sys/tools: invalid latest version',
      },
      {
        versions: () =>
          versionsMalformed({ scope: 'sys', name: 'tools', latest: 'newest', versions: {} }),
        error: 'Could not retrieve JSR package metadata for @sys/tools: invalid latest version',
      },
      {
        versions: () =>
          versionsMalformed({ scope: 'sys', name: 'tools', latest: '^9.9.9', versions: {} }),
        error: 'Could not retrieve JSR package metadata for @sys/tools: invalid latest version',
      },
    ];

    for (const test of cases) {
      await expectError(
        () =>
          getVersionInfo('/tmp' as t.StringDir, {
            versions: test.versions,
            resolvePackage: (args) => {
              resolutions.push(args.specifier);
              return Promise.resolve({
                ok: true as const,
                specifier: args.specifier,
                registry: 'jsr' as const,
                package: '@sys/tools' as t.StringPkgName,
                resolved: pkg.version as t.StringSemver,
              });
            },
          }),
        test.error,
      );
    }

    expect(resolutions).to.eql([]);
  });

  it('keeps successful registry parity truthful despite an unnecessary resolver failure', async () => {
    const local = pkg.version as t.StringSemver;

    const res = await getVersionInfo('/tmp' as t.StringDir, {
      versions: () => versionsSuccess({ latest: local }),
      resolvePackage: (args) =>
        Promise.resolve({
          ok: false as const,
          specifier: args.specifier,
          registry: 'jsr' as const,
          package: '@sys/tools' as t.StringPkgName,
          reason: { code: 'registry' as const },
        }),
    });

    expect(res.is).to.eql({
      latest: true,
      upgradeAvailable: false,
      pending: false,
      resolverUnavailable: false,
    });
  });

  it('does not force Deno resolver reload during the default foreground check', async () => {
    const reloads: Array<boolean | undefined> = [];

    await getVersionInfo('/tmp' as t.StringDir, {
      versions: () => versionsSuccess({ latest: '0.0.319' as t.StringSemver }),
      resolvePackage: (args) => {
        reloads.push(args.reload);
        return Promise.resolve({
          ok: true as const,
          specifier: args.specifier,
          registry: 'jsr' as const,
          package: '@sys/tools' as t.StringPkgName,
          resolved: '0.0.319' as t.StringSemver,
        });
      },
    });

    expect(reloads).to.eql([false]);
  });

  it('can explicitly request a fresh Deno resolver reload for verification', async () => {
    const reloads: Array<boolean | undefined> = [];

    await getVersionInfo('/tmp' as t.StringDir, {
      resolverReload: true,
      versions: () => versionsSuccess({ latest: '0.0.319' as t.StringSemver }),
      resolvePackage: (args) => {
        reloads.push(args.reload);
        return Promise.resolve({
          ok: true as const,
          specifier: args.specifier,
          registry: 'jsr' as const,
          package: '@sys/tools' as t.StringPkgName,
          resolved: '0.0.319' as t.StringSemver,
        });
      },
    });

    expect(reloads).to.eql([true]);
  });

  it('checks self-upgrade through public JSR resolution without workspace config or lock', async () => {
    const calls: Array<{
      readonly specifier: string;
      readonly noConfig?: boolean;
      readonly noLock?: boolean;
    }> = [];

    await getVersionInfo('/workspace/sys' as t.StringDir, {
      versions: () => versionsSuccess({ latest: '0.0.319' as t.StringSemver }),
      resolvePackage: (args) => {
        calls.push({
          specifier: args.specifier,
          noConfig: args.noConfig,
          noLock: args.noLock,
        });
        return Promise.resolve({
          ok: true as const,
          specifier: args.specifier,
          registry: 'jsr' as const,
          package: '@sys/tools' as t.StringPkgName,
          resolved: '0.0.319' as t.StringSemver,
        });
      },
    });

    expect(calls).to.eql([
      { specifier: 'jsr:@sys/tools', noConfig: true, noLock: true },
    ]);
  });

  it('probes the published latest version when resolver policy holds the actionable version', async () => {
    const local = pkg.version as t.StringSemver;
    const calls: Array<{ readonly specifier: string; readonly reload?: boolean }> = [];

    const res = await getVersionInfo('/tmp' as t.StringDir, {
      versions: () =>
        versionsSuccess({
          latest: '9.9.9' as t.StringSemver,
          versions: { '9.9.9': { createdAt: '2026-07-05T01:17:43.938610Z' } },
        }),
      resolvePackage: (args) => {
        calls.push({ specifier: args.specifier, reload: args.reload });
        if (args.specifier === 'jsr:@sys/tools@9.9.9') {
          return Promise.resolve({
            ok: false as const,
            specifier: args.specifier,
            registry: 'jsr' as const,
            package: '@sys/tools' as t.StringPkgName,
            reason: { code: 'policy:minimum-dependency-age' as const },
          });
        }
        return Promise.resolve({
          ok: true as const,
          specifier: args.specifier,
          registry: 'jsr' as const,
          package: '@sys/tools' as t.StringPkgName,
          resolved: local,
        });
      },
    });

    expect(calls).to.eql([
      { specifier: 'jsr:@sys/tools', reload: false },
      { specifier: 'jsr:@sys/tools@9.9.9', reload: false },
    ]);
    expect(res.remoteCreatedAt).to.eql('2026-07-05T01:17:43.938610Z');
    expect(res.is.pending).to.eql(true);
    expect(res.latestResolution?.ok).to.eql(false);
    if (res.latestResolution?.ok === false) {
      expect(res.latestResolution.reason.code).to.eql('policy:minimum-dependency-age');
    }
  });

  it('uses a successful pinned-latest probe to classify stale cache as upgradeable', async () => {
    const local = pkg.version as t.StringSemver;
    const calls: Array<{ readonly specifier: string; readonly reload?: boolean }> = [];

    const res = await getVersionInfo('/tmp' as t.StringDir, {
      versions: () => versionsSuccess({ latest: '9.9.9' as t.StringSemver }),
      resolvePackage: (args) => {
        calls.push({ specifier: args.specifier, reload: args.reload });
        const resolved = args.specifier === 'jsr:@sys/tools@9.9.9'
          ? '9.9.9' as t.StringSemver
          : local;
        return Promise.resolve({
          ok: true as const,
          specifier: args.specifier,
          registry: 'jsr' as const,
          package: '@sys/tools' as t.StringPkgName,
          resolved,
        });
      },
    });

    expect(calls).to.eql([
      { specifier: 'jsr:@sys/tools', reload: false },
      { specifier: 'jsr:@sys/tools@9.9.9', reload: false },
    ]);
    expect(res.is.upgradeAvailable).to.eql(true);
    expect(res.is.pending).to.eql(false);
    expect(toVersionState(res).actionable).to.eql('9.9.9');
  });
});
