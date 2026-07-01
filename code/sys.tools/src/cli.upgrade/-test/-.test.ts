import { Cli, describe, expect, Is, it, type t } from '../../-test.ts';
import { D } from '../common.ts';
import { UpgradeTools } from '../mod.ts';
import { runUpgrade } from '../u.cmd.runUpgrade.ts';

describe(D.tool.name, () => {
  it('API', async () => {
    const m = await import('@sys/tools/upgrade');
    expect(m.UpgradeTools).to.equal(UpgradeTools);
  });
});

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
      expect(
        plain.some((line) =>
          line.includes('Local version 0.0.318 of @sys/tools is the most recent release')
        ),
      ).to.eql(true);
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

  describe('actionable upgrade', () => {
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

  describe('pending resolver policy', () => {
    it('reports pending when published latest is not currently actionable', async () => {
      const events: string[] = [];
      let refreshed = false;
      let prompted = false;

      await runUpgrade('/tmp' as t.StringDir, { interactive: false }, {
        getVersionInfo: async () => ({
          local: '0.0.318',
          remote: '0.0.319',
          latest: '0.0.318',
          actionable: '0.0.318',
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
      expect(plain.some((line) => line.includes('Published version 0.0.319'))).to.eql(true);
      expect(plain.some((line) => line.includes('Deno currently resolves @sys/tools to 0.0.318')))
        .to.eql(true);
      expect(plain.join('\n')).to.not.contain('upgrade now to 0.0.319');
    });

    it('reports resolver-unavailable state without claiming Deno resolved the local version', async () => {
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
      expect(output).to.contain('Could not verify Deno-actionable @sys/tools version');
      expect(output).to.contain('cache refresh was not run');
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
