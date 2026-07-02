import { Cli, describe, expect, Is, it, type t } from '../../-test.ts';
import { runUpgrade } from '../u.cmd.runUpgrade.ts';

describe('cli.upgrade.runUpgrade', () => {
  describe('already latest', () => {
    it('shows a version-check spinner and exits without prompting when already latest', async () => {
      const events: string[] = [];
      let prompted = false;
      let refreshed = false;
      let advisoryRemote = '';

      await runUpgrade('/tmp' as t.StringDir, { interactive: true }, {
        getVersionInfo: async () => ({
          local: '0.0.318',
          remote: '0.0.318',
          latest: '0.0.318',
          is: { latest: true },
        }),
        refreshCache: async () => {
          refreshed = true;
          return {
            success: true,
            code: 0,
            text: { stdout: '', stderr: '' },
            toString: () => '',
          };
        },
        prompt: async () => {
          prompted = true;
          return 'upgrade';
        },
        spinner: () => spinner(events),
        info: (...data) => {
          events.push(`info:${data.map(String).join(' ')}`);
        },
        writeAdvisorySuccess: async (version) => {
          advisoryRemote = version.remote;
        },
      });

      const plain = events.map((line) => Cli.stripAnsi(line));
      expect(plain[0]).to.include('start:checking latest @sys/tools version...');
      expect(plain[1]).to.eql('stop');
      expect(plain.some((line) => line.includes('@sys/tools is up to date'))).to.eql(true);
      expect(plain.some((line) => line.includes('No upgrade needed.'))).to.eql(true);
      expect(prompted).to.eql(false);
      expect(refreshed).to.eql(false);
      expect(advisoryRemote).to.eql('0.0.318');
    });

    it('offers back instead of exiting when root-menu upgrade is already latest', async () => {
      let prompted = false;
      let refreshed = false;
      let message = '';
      let options: string[] = [];

      const result = await runUpgrade('/tmp' as t.StringDir, {
        interactive: true,
        source: 'root-menu',
      }, {
        getVersionInfo: async () => ({
          local: '0.0.318',
          remote: '0.0.318',
          latest: '0.0.318',
          is: { latest: true },
        }),
        refreshCache: async () => {
          refreshed = true;
          return { success: true, toString: () => '' };
        },
        prompt: async (args) => {
          prompted = true;
          message = String(args.message);
          options = promptOptionNames(args.options);
          return '__back__';
        },
        spinner: () => spinner([]),
        info() {},
        async writeAdvisorySuccess() {},
      });

      expect(result).to.eql({ kind: 'back' });
      expect(prompted).to.eql(true);
      expect(refreshed).to.eql(false);
      expect(message).to.eql('No upgrades');
      expect(options).to.eql(['  rescan', '← back']);
    });

    it('rescans from the root-menu latest screen before returning back', async () => {
      let versionChecks = 0;
      let prompts = 0;
      let refreshed = false;

      const result = await runUpgrade('/tmp' as t.StringDir, {
        interactive: true,
        source: 'root-menu',
      }, {
        getVersionInfo: async () => {
          versionChecks += 1;
          return {
            local: '0.0.318',
            remote: '0.0.318',
            latest: '0.0.318',
            is: { latest: true },
          };
        },
        refreshCache: async () => {
          refreshed = true;
          return { success: true, toString: () => '' };
        },
        prompt: async () => {
          prompts += 1;
          return prompts === 1 ? '__rescan__' : '__back__';
        },
        spinner: () => spinner([]),
        info() {},
        async writeAdvisorySuccess() {},
      });

      expect(result).to.eql({ kind: 'back' });
      expect(versionChecks).to.eql(2);
      expect(prompts).to.eql(2);
      expect(refreshed).to.eql(false);
    });
  });

  describe('upgrade available', () => {
    it('checks latest first, then prompts, then runs the refresh spinner', async () => {
      const events: string[] = [];
      let advisoryRemote = '';

      await runUpgrade('/tmp' as t.StringDir, { interactive: true }, {
        getVersionInfo: async () => ({
          local: '0.0.318',
          remote: '0.0.319',
          latest: '0.0.319',
          is: { latest: false },
        }),
        refreshCache: async () => ({
          success: true,
          code: 0,
          text: { stdout: '', stderr: '' },
          toString: () => '',
        }),
        prompt: async () => {
          events.push('prompt');
          return 'upgrade';
        },
        spinner: () => spinner(events),
        info(...data) {
          events.push(`info:${data.map(String).join(' ')}`);
        },
        async writeAdvisorySuccess(version) {
          advisoryRemote = version.remote;
        },
      });

      const plain = events.map((line) => Cli.stripAnsi(line));
      expect(plain[0]).to.include('start:checking latest @sys/tools version...');
      expect(plain[1]).to.eql('stop');
      expect(plain).to.include('prompt');
      expect(
        plain.findIndex((line) => line.includes('start:checking latest @sys/tools version...')),
      )
        .to.be.lessThan(
          plain.indexOf('prompt'),
        );
      expect(
        plain.findIndex((line) =>
          line.includes('start:upgrading @sys/tools from 0.0.318 to 0.0.319...')
        ),
      ).to.be.greaterThan(
        plain.indexOf('prompt'),
      );
      expect(advisoryRemote).to.eql('0.0.319');
    });

    it('uses non-reload resolver check before refresh and reload resolver verification after refresh', async () => {
      const resolverReloads: Array<boolean | undefined> = [];
      let refreshed = false;

      await runUpgrade('/tmp' as t.StringDir, { interactive: false }, {
        getVersionInfo: async (_cwd, options) => {
          resolverReloads.push(options?.resolverReload);
          return {
            local: '0.0.318',
            remote: '0.0.319',
            latest: '0.0.319',
            actionable: '0.0.319',
            is: { latest: false, upgradeAvailable: true, pending: false },
          };
        },
        refreshCache: async () => {
          refreshed = true;
          return { success: true, toString: () => '' };
        },
        prompt: async () => 'upgrade',
        spinner: () => spinner([]),
        info() {},
        async writeAdvisorySuccess() {},
      });

      expect(refreshed).to.eql(true);
      expect(resolverReloads).to.eql([false, true]);
    });

    it('keeps direct interactive prompts on the existing upgrade/exit menu', async () => {
      let refreshed = false;
      let options: string[] = [];

      const result = await runUpgrade(
        '/tmp' as t.StringDir,
        { interactive: true, source: 'argv' },
        {
          getVersionInfo: async () => ({
            local: '0.0.318',
            remote: '0.0.319',
            latest: '0.0.319',
            is: { latest: false },
          }),
          refreshCache: async () => {
            refreshed = true;
            return { success: true, toString: () => '' };
          },
          prompt: async (args) => {
            options = promptOptionNames(args.options);
            return '__exit__';
          },
          spinner: () => spinner([]),
          info() {},
          async writeAdvisorySuccess() {},
        },
      );

      expect(result).to.eql(undefined);
      expect(refreshed).to.eql(false);
      expect(options).to.eql([
        ' - upgrade now to 0.0.319',
        '(exit)',
      ]);
    });

    it('uses a back affordance from the root menu and returns without refreshing', async () => {
      let refreshed = false;
      let options: string[] = [];

      const result = await runUpgrade('/tmp' as t.StringDir, {
        interactive: true,
        source: 'root-menu',
      }, {
        getVersionInfo: async () => ({
          local: '0.0.318',
          remote: '0.0.319',
          latest: '0.0.319',
          is: { latest: false },
        }),
        refreshCache: async () => {
          refreshed = true;
          return { success: true, toString: () => '' };
        },
        prompt: async (args) => {
          options = promptOptionNames(args.options);
          return '__back__';
        },
        spinner: () => spinner([]),
        info() {},
        async writeAdvisorySuccess() {},
      });

      expect(result).to.eql({ kind: 'back' });
      expect(refreshed).to.eql(false);
      expect(options).to.eql([
        '  upgrade now to 0.0.319',
        '← back',
      ]);
      expect(options.join('\n')).to.not.contain('(exit)');
    });
  });

  describe('upgrade standing down', () => {
    it('reports standdown when latest cannot be used yet', async () => {
      const events: string[] = [];
      let refreshed = false;
      let prompted = false;

      await runUpgrade('/tmp' as t.StringDir, { interactive: false }, {
        getVersionInfo: async () => ({
          local: '0.0.318',
          remote: '0.0.319',
          latest: '0.0.318',
          actionable: '0.0.318',
          latestResolution: {
            ok: false,
            specifier: 'jsr:@sys/tools@0.0.319' as t.StringModuleSpecifier,
            registry: 'jsr',
            package: '@sys/tools' as t.StringPkgName,
            reason: { code: 'policy:minimum-dependency-age' },
          },
          is: { latest: true, upgradeAvailable: false, pending: true },
        }),
        refreshCache: async () => {
          refreshed = true;
          return { success: true, toString: () => '' };
        },
        prompt: async () => {
          prompted = true;
          return 'upgrade';
        },
        spinner: () => spinner(events),
        info(...data) {
          events.push(`info:${data.map(String).join(' ')}`);
        },
        async writeAdvisorySuccess() {},
      });

      const plain = events.map((line) => Cli.stripAnsi(line));
      expect(refreshed).to.eql(false);
      expect(prompted).to.eql(false);
      expect(plain.some((line) => line.includes('@sys/tools upgrade standing down'))).to.eql(true);
      expect(plain.some((line) => line.includes('held at  0.0.318'))).to.eql(true);
      expect(plain.some((line) => line.includes('Deno is not allowing this upgrade yet.')))
        .to.eql(true);
      expect(plain.some((line) => line.includes('Reason: Deno minimum dependency age policy.')))
        .to.eql(true);
      expect(plain.join('\n')).to.not.contain('upgrade now to 0.0.319');
    });

    it('reports unavailable upgrade checks without claiming a held version', async () => {
      const events: string[] = [];
      let refreshed = false;
      let prompted = false;

      await runUpgrade('/tmp' as t.StringDir, { interactive: false }, {
        getVersionInfo: async () => ({
          local: '0.0.318',
          remote: '0.0.319',
          latest: '0.0.318',
          resolution: {
            ok: false,
            specifier: 'jsr:@sys/tools' as t.StringModuleSpecifier,
            registry: 'jsr',
            package: '@sys/tools' as t.StringPkgName,
            reason: { code: 'registry' },
          },
          is: { latest: true, upgradeAvailable: false, pending: false, resolverUnavailable: true },
        }),
        refreshCache: async () => {
          refreshed = true;
          return { success: true, toString: () => '' };
        },
        prompt: async () => {
          prompted = true;
          return 'upgrade';
        },
        spinner: () => spinner(events),
        info(...data) {
          events.push(`info:${data.map(String).join(' ')}`);
        },
        async writeAdvisorySuccess() {},
      });

      const plain = events.map((line) => Cli.stripAnsi(line));
      const output = plain.join('\n');
      expect(refreshed).to.eql(false);
      expect(prompted).to.eql(false);
      expect(output).to.contain('@sys/tools upgrade check unavailable');
      expect(output).to.contain('Could not complete the upgrade check.');
      expect(output).to.not.contain('Deno currently resolves @sys/tools to 0.0.318');
    });
  });

  describe('refresh outcomes', () => {
    it('fails instead of claiming success when post-refresh resolver verification misses target', async () => {
      let versionChecks = 0;
      let refreshed = false;

      let error: unknown;
      try {
        await runUpgrade('/tmp' as t.StringDir, { interactive: false }, {
          getVersionInfo: async () => {
            versionChecks += 1;
            return versionChecks === 1
              ? {
                local: '0.0.318',
                remote: '0.0.319',
                latest: '0.0.319',
                actionable: '0.0.319',
                is: { latest: false, upgradeAvailable: true, pending: false },
              }
              : {
                local: '0.0.318',
                remote: '0.0.319',
                latest: '0.0.318',
                actionable: '0.0.318',
                is: { latest: true, upgradeAvailable: false, pending: true },
              };
          },
          refreshCache: async () => {
            refreshed = true;
            return { success: true, toString: () => '' };
          },
          prompt: async () => 'upgrade',
          spinner: () => spinner([]),
          info() {},
          async writeAdvisorySuccess() {},
        });
      } catch (err) {
        error = err;
      }

      expect(refreshed).to.eql(true);
      expect(versionChecks).to.eql(2);
      expect(error).to.be.instanceOf(Error);
      expect((error as Error).message).to.include('Failed to verify @sys/tools upgrade');
    });

    it('fails truthfully when post-refresh resolver verification becomes unavailable', async () => {
      let versionChecks = 0;
      let refreshed = false;

      let error: unknown;
      try {
        await runUpgrade('/tmp' as t.StringDir, { interactive: false }, {
          getVersionInfo: async () => {
            versionChecks += 1;
            return versionChecks === 1
              ? {
                local: '0.0.318',
                remote: '0.0.319',
                latest: '0.0.319',
                actionable: '0.0.319',
                is: { latest: false, upgradeAvailable: true, pending: false },
              }
              : {
                local: '0.0.318',
                remote: '0.0.319',
                latest: '0.0.318',
                resolution: {
                  ok: false,
                  specifier: 'jsr:@sys/tools' as t.StringModuleSpecifier,
                  registry: 'jsr',
                  package: '@sys/tools' as t.StringPkgName,
                  reason: { code: 'registry' },
                },
                is: {
                  latest: true,
                  upgradeAvailable: false,
                  pending: false,
                  resolverUnavailable: true,
                },
              };
          },
          refreshCache: async () => {
            refreshed = true;
            return { success: true, toString: () => '' };
          },
          prompt: async () => 'upgrade',
          spinner: () => spinner([]),
          info() {},
          async writeAdvisorySuccess() {},
        });
      } catch (err) {
        error = err;
      }

      expect(refreshed).to.eql(true);
      expect(versionChecks).to.eql(2);
      expect(error).to.be.instanceOf(Error);
      expect((error as Error).message).to.include('Deno resolver state is unavailable');
      expect((error as Error).message).to.not.include('resolved 0.0.318');
    });

    it('keeps upgrade flow working when advisory persistence fails', async () => {
      const events: string[] = [];
      let refreshed = false;

      await runUpgrade('/tmp' as t.StringDir, { interactive: false }, {
        getVersionInfo: async () => ({
          local: '0.0.318',
          remote: '0.0.319',
          latest: '0.0.319',
          is: { latest: false },
        }),
        refreshCache: async () => {
          refreshed = true;
          return {
            success: true,
            code: 0,
            text: { stdout: '', stderr: '' },
            toString: () => '',
          };
        },
        prompt: async () => 'upgrade',
        spinner: () => spinner(events),
        info(...data) {
          events.push(`info:${data.map(String).join(' ')}`);
        },
        async writeAdvisorySuccess() {
          throw new Error('disk full');
        },
      });

      const plain = events.map((line) => Cli.stripAnsi(line));
      expect(refreshed).to.eql(true);
      expect(
        plain.some((line) => line.includes('Upgraded @sys/tools to 0.0.319 ✔')),
      ).to.eql(true);
    });
  });
});

function promptOptionNames(
  options: readonly unknown[],
  opts: { stripAnsi?: boolean } = {},
) {
  const { stripAnsi = true } = opts;
  return options.map((option) => {
    const name = Is.str(option)
      ? option
      : String((option as { readonly name?: unknown }).name ?? '');
    return stripAnsi ? Cli.stripAnsi(name) : name;
  });
}

function spinner(events: string[]) {
  return {
    text: '',
    start(text?: string) {
      events.push(`start:${String(text ?? '')}`);
      this.text = String(text ?? '');
      return this;
    },
    stop() {
      events.push('stop');
      return this;
    },
    succeed(text?: string) {
      events.push(`succeed:${Cli.stripAnsi(String(text ?? ''))}`);
      this.text = String(text ?? '');
      return this;
    },
    fail(text?: string) {
      events.push(`fail:${Cli.stripAnsi(String(text ?? ''))}`);
      this.text = String(text ?? '');
      return this;
    },
  };
}
