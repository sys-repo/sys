import { describe, expect, it, type t } from '../../-test.ts';
import { pkg } from '../common.ts';
import { getVersionInfo } from '../u.ts';

describe('cli.upgrade.getVersionInfo', () => {
  it('does not mark standdown when the running version is already latest', async () => {
    const local = pkg.version as t.StringSemver;

    const res = await getVersionInfo('/tmp' as t.StringDir, {
      versions: async () => ({ data: { latest: local } } as never),
      resolvePackage: async (args) => ({
        ok: true,
        specifier: args.specifier,
        registry: 'jsr',
        package: '@sys/tools' as t.StringPkgName,
        resolved: '0.0.0' as t.StringSemver,
      }),
    });

    expect(res.is.pending).to.eql(false);
    expect(res.is.upgradeAvailable).to.eql(false);
  });

  it('does not force Deno resolver reload during the default foreground check', async () => {
    const reloads: Array<boolean | undefined> = [];

    await getVersionInfo('/tmp' as t.StringDir, {
      versions: async () => ({ data: { latest: '0.0.319' as t.StringSemver } } as never),
      resolvePackage: async (args) => {
        reloads.push(args.reload);
        return {
          ok: true,
          specifier: args.specifier,
          registry: 'jsr',
          package: '@sys/tools' as t.StringPkgName,
          resolved: '0.0.319' as t.StringSemver,
        };
      },
    });

    expect(reloads).to.eql([false]);
  });

  it('can explicitly request a fresh Deno resolver reload for verification', async () => {
    const reloads: Array<boolean | undefined> = [];

    await getVersionInfo('/tmp' as t.StringDir, {
      resolverReload: true,
      versions: async () => ({ data: { latest: '0.0.319' as t.StringSemver } } as never),
      resolvePackage: async (args) => {
        reloads.push(args.reload);
        return {
          ok: true,
          specifier: args.specifier,
          registry: 'jsr',
          package: '@sys/tools' as t.StringPkgName,
          resolved: '0.0.319' as t.StringSemver,
        };
      },
    });

    expect(reloads).to.eql([true]);
  });

  it('probes the published latest version when resolver policy holds the actionable version', async () => {
    const local = pkg.version as t.StringSemver;
    const calls: Array<{ readonly specifier: string; readonly reload?: boolean }> = [];

    const res = await getVersionInfo('/tmp' as t.StringDir, {
      versions: async () => ({ data: { latest: '9.9.9' as t.StringSemver } } as never),
      resolvePackage: async (args) => {
        calls.push({ specifier: args.specifier, reload: args.reload });
        if (args.specifier === 'jsr:@sys/tools@9.9.9') {
          return {
            ok: false,
            specifier: args.specifier,
            registry: 'jsr',
            package: '@sys/tools' as t.StringPkgName,
            reason: { code: 'policy:minimum-dependency-age' },
          };
        }
        return {
          ok: true,
          specifier: args.specifier,
          registry: 'jsr',
          package: '@sys/tools' as t.StringPkgName,
          resolved: local,
        };
      },
    });

    expect(calls).to.eql([
      { specifier: 'jsr:@sys/tools', reload: false },
      { specifier: 'jsr:@sys/tools@9.9.9', reload: false },
    ]);
    expect(res.is.pending).to.eql(true);
    expect(res.latestResolution?.ok).to.eql(false);
    if (res.latestResolution?.ok === false) {
      expect(res.latestResolution.reason.code).to.eql('policy:minimum-dependency-age');
    }
  });
});
