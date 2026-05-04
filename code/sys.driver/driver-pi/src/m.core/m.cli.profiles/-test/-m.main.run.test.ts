import { describe, expect, it } from '../../../-test.ts';
import { Cli, Fs, Str, type t } from '../common.ts';
import { Process } from '../../m.cli/common.ts';
import { Profiles } from '../mod.ts';

describe(`@sys/driver-pi/cli/Profiles/m.main/run`, () => {
  it('runs selected config and passes argv after -- through to Pi', async () => {
    const prev = Process.inherit;
    const prevInfo = console.info;
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.m.main.test.' }))
      .absolute as t.StringDir;
    const config = `${cwd}/profiles.yaml` as t.StringPath;
    const calls: string[] = [];
    try {
      await Fs.ensureDir(Fs.join(cwd, '.git'));
      await Fs.write(
        config,
        Str.dedent(
          `
          sandbox:
            capability:
              read: [./canon]
              env:
                PI_PROFILE: main
          `,
        ).trimStart(),
      );
      console.info = (value?: unknown) => calls.push(String(value ?? ''));

      Process.inherit = async (input) => {
        expect(input.cwd).to.eql(cwd);
        expect(input.args).to.include.members(['--help']);
        expect(input.args).not.to.include('--model');
        expect(input.env?.PI_PROFILE).to.eql('main');
        return { code: 0, success: true, signal: null };
      };

      const res = await Profiles.main({ cwd, argv: ['--config', config, '--', '--help'] });
      expect(res.kind).to.eql('run');
      const printed = Cli.stripAnsi(calls.join('\n'));
      expect(printed).to.contain('pi:sandbox');
      expect(printed).to.contain('.sandbox.log.md');
    } finally {
      Process.inherit = prev;
      console.info = prevInfo;
      await Fs.remove(cwd);
    }
  });

  it('routes explicit allow-all through Profiles into the Pi child and sandbox display', async () => {
    const prev = Process.inherit;
    const prevInfo = console.info;
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.m.main.test.' }))
      .absolute as t.StringDir;
    const config = `${cwd}/profiles.yaml` as t.StringPath;
    const calls: string[] = [];
    try {
      await Fs.ensureDir(Fs.join(cwd, '.git'));
      await Fs.write(config, 'sandbox: {}\n');
      console.info = (value?: unknown) => calls.push(String(value ?? ''));

      Process.inherit = async (input) => {
        expect(input.args).to.include('--allow-all');
        expect(input.args.some((arg) => arg.startsWith('--allow-read='))).to.eql(false);
        expect(input.args.some((arg) => arg.startsWith('--allow-write='))).to.eql(false);
        return { code: 0, success: true, signal: null };
      };

      const res = await Profiles.main({ cwd, argv: ['--allow-all', '--config', config] });
      expect(res.kind).to.eql('run');
      const printed = Cli.stripAnsi(calls.join('\n'));
      expect(printed).to.match(/permissions\s+allow-all/);
      expect(printed).to.match(/read\s+all/);
      expect(printed).to.match(/write\s+all/);
    } finally {
      Process.inherit = prev;
      console.info = prevInfo;
      await Fs.remove(cwd);
    }
  });

  it('resolves --profile via the standard profile file naming convention', async () => {
    const prev = Process.inherit;
    const prevInfo = console.info;
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.m.main.test.' }))
      .absolute as t.StringDir;
    const nested = Fs.join(cwd, 'nested') as t.StringDir;
    const config = `${cwd}/-config/@sys.driver-pi/canon.yaml` as t.StringPath;
    const calls: string[] = [];
    try {
      await Fs.ensureDir(Fs.join(cwd, '.git'));
      await Fs.ensureDir(nested);
      await Fs.ensureDir(Fs.dirname(config));
      await Fs.write(
        config,
        Str.dedent(`
        sandbox:
          capability:
            env:
              PI_PROFILE: canon
      `).trimStart(),
      );
      console.info = (value?: unknown) => calls.push(String(value ?? ''));

      Process.inherit = async (input) => {
        expect(input.cwd).to.eql(nested);
        expect(input.args).to.include.members(['--help']);
        expect(input.args).not.to.include('--model');
        expect(input.env?.PI_PROFILE).to.eql('canon');
        return { code: 0, success: true, signal: null };
      };

      const res = await Profiles.main({
        cwd: nested,
        argv: ['--profile', 'canon', '--', '--help'],
      });
      expect(res.kind).to.eql('run');
      const printed = Cli.stripAnsi(calls.join('\n'));
      expect(printed).to.contain('pi:sandbox');
      expect(printed).to.contain('.sandbox.log.md');
    } finally {
      Process.inherit = prev;
      console.info = prevInfo;
      await Fs.remove(cwd);
    }
  });

  it('resolves profile sandbox paths from the runtime root, not the invoked nested cwd', async () => {
    const prev = Process.inherit;
    const prevInfo = console.info;
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.m.main.test.' }))
      .absolute as t.StringDir;
    const nested = Fs.join(cwd, 'nested', 'child') as t.StringDir;
    const config = `${cwd}/-config/@sys.driver-pi/canon.yaml` as t.StringPath;
    const contextFile = Fs.join(cwd, 'canon', 'AGENTS.md') as t.StringPath;
    const calls: string[] = [];
    try {
      await Fs.ensureDir(Fs.join(cwd, '.git'));
      await Fs.ensureDir(nested);
      await Fs.ensureDir(Fs.dirname(config));
      await Fs.ensureDir(Fs.dirname(contextFile));
      await Fs.write(contextFile, '# Canon context\n');
      await Fs.write(
        config,
        Str.dedent(`
        sandbox:
          capability:
            read: [./canon]
            write: [./canon]
          context:
            append:
              - ./canon/AGENTS.md
      `).trimStart(),
      );
      console.info = (value?: unknown) => calls.push(String(value ?? ''));

      Process.inherit = async (input) => {
        expect(input.cwd).to.eql(nested);
        const readArg = input.args.find((arg) => arg.startsWith('--allow-read='));
        const writeArg = input.args.find((arg) => arg.startsWith('--allow-write='));
        expect(readArg).to.contain(Fs.join(cwd, 'canon'));
        expect(writeArg).to.contain(Fs.join(cwd, 'canon'));
        expect(input.args).to.include.members(['--help']);
        return { code: 0, success: true, signal: null };
      };

      const res = await Profiles.main({
        cwd: nested,
        argv: ['--profile', 'canon', '--', '--help'],
      });
      expect(res.kind).to.eql('run');
      const printed = Cli.stripAnsi(calls.join('\n'));
      expect(printed).to.contain('canon/AGENTS.md');
      expect(printed).to.contain('pi:sandbox');
    } finally {
      Process.inherit = prev;
      console.info = prevInfo;
      await Fs.remove(cwd);
    }
  });

  it('migrates legacy profile directory before direct --profile resolution', async () => {
    const prev = Process.inherit;
    const prevInfo = console.info;
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.m.main.test.' }))
      .absolute as t.StringDir;
    const oldConfig = `${cwd}/-config/@sys.driver-pi.pi/canon.yaml` as t.StringPath;
    const newConfig = `${cwd}/-config/@sys.driver-pi/canon.yaml` as t.StringPath;
    const calls: string[] = [];
    try {
      await Fs.ensureDir(Fs.join(cwd, '.git'));
      await Fs.ensureDir(Fs.dirname(oldConfig));
      await Fs.write(
        oldConfig,
        Str.dedent(`
        sandbox:
          capability:
            env:
              PI_PROFILE: migrated
      `).trimStart(),
      );
      console.info = (value?: unknown) => calls.push(String(value ?? ''));

      Process.inherit = async (input) => {
        expect(input.cwd).to.eql(cwd);
        expect(input.env?.PI_PROFILE).to.eql('migrated');
        expect(await Fs.exists(oldConfig)).to.eql(false);
        expect(await Fs.exists(newConfig)).to.eql(true);
        return { code: 0, success: true, signal: null };
      };

      const res = await Profiles.main({ cwd, argv: ['--profile', 'canon'] });
      expect(res.kind).to.eql('run');
      const printed = Cli.stripAnsi(calls.join('\n'));
      expect(printed).to.contain('Migrated 1 Pi config/runtime item.');
      expect(printed).to.contain('pi:sandbox');
    } finally {
      Process.inherit = prev;
      console.info = prevInfo;
      await Fs.remove(cwd);
    }
  });

  it('bootstraps the default profile on first direct --profile default run', async () => {
    const prev = Process.inherit;
    const prevInfo = console.info;
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.m.main.test.' }))
      .absolute as t.StringDir;
    const calls: string[] = [];
    try {
      await Fs.ensureDir(Fs.join(cwd, '.git'));
      console.info = (value?: unknown) => calls.push(String(value ?? ''));

      Process.inherit = async (input) => {
        expect(input.cwd).to.eql(cwd);
        expect(input.args).to.include.members(['--help']);
        const created = `${cwd}/-config/@sys.driver-pi/default.yaml`;
        const read = await Fs.readText(created);
        expect(read.ok).to.eql(true);
        expect(read.data ?? '').to.contain('# pi profile: default');
        return { code: 0, success: true, signal: null };
      };

      const res = await Profiles.main({ cwd, argv: ['--profile', 'default', '--', '--help'] });
      expect(res.kind).to.eql('run');
      const printed = Cli.stripAnsi(calls.join('\n'));
      expect(printed).to.contain('pi:sandbox');
      expect(printed).to.contain('.sandbox.log.md');
      expect(printed).to.contain('write:cwd');
    } finally {
      Process.inherit = prev;
      console.info = prevInfo;
      await Fs.remove(cwd);
    }
  });
});
