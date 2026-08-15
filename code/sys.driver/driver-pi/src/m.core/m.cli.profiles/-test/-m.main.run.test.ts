import { describe, expect, it } from '../../../-test.ts';
import { Process as ProcessOwner } from '../../m.cli/common.ts';
import { Cli, Fs, Str, type t } from '../common.ts';
import { Profiles as ProfilesOwner } from '../mod.ts';
import { ProfilesFs } from '../u/u.fs.ts';
import { PiSandboxReport } from '../../m.cli/u.report.sandbox.ts';
import { withInherit } from '../../m.cli/u.inherit.ts';

const Process = { ...ProcessOwner };
const Profiles = {
  ...ProfilesOwner,
  main: (input: Parameters<typeof ProfilesOwner.main>[0]) =>
    withInherit(Process.inherit, () => ProfilesOwner.main(input)),
};

describe(`@sys/driver-pi/cli/Profiles/m.main/run`, () => {
  it('runs selected profile path only after the report and compact sheet are observable', async () => {
    const prev = Process.inherit;
    const prevInfo = console.info;
    const prevReportWrite = PiSandboxReport.write;
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.m.main.test.' })).absolute;
    const config = `${cwd}/profiles.yaml` as t.StringPath;
    const calls: string[] = [];
    const events: string[] = [];
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
      console.info = (value?: unknown) => {
        const text = String(value ?? '');
        calls.push(text);
        if (Cli.stripAnsi(text).includes('sys:pi:sandbox')) events.push('sheet');
      };
      Object.defineProperty(PiSandboxReport, 'write', {
        value: async (input: Parameters<typeof PiSandboxReport.write>[0]) => {
          events.push('report:start');
          const path = await prevReportWrite(input);
          events.push('report:done');
          return path;
        },
      });

      Process.inherit = async (input) => {
        events.push('launch');
        expect(input.cwd).to.eql(cwd);
        expect(input.args).to.include.members(['--help']);
        expect(input.args).not.to.include('--model');
        expect(input.env?.PI_PROFILE).to.eql('main');
        return { code: 0, success: true, signal: null };
      };

      const res = await Profiles.main({
        cwd,
        argv: ['--profile', './profiles.yaml', '--', '--help'],
      });
      expect(res.kind).to.eql('run');
      const printed = Cli.stripAnsi(calls.join('\n'));
      expect(printed).to.contain('sys:pi:sandbox');
      expect(printed).to.contain('.sandbox.log.md');
      expect(events).to.eql(['report:start', 'report:done', 'sheet', 'launch']);
    } finally {
      Process.inherit = prev;
      console.info = prevInfo;
      Object.defineProperty(PiSandboxReport, 'write', { value: prevReportWrite });
      await Fs.remove(cwd);
    }
  });

  it('treats a YAML-looking profile selector as an explicit path', async () => {
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
              env:
                PI_PROFILE: explicit-yaml
          `,
        ).trimStart(),
      );
      console.info = (value?: unknown) => calls.push(String(value ?? ''));

      Process.inherit = async (input) => {
        expect(input.cwd).to.eql(cwd);
        expect(input.env?.PI_PROFILE).to.eql('explicit-yaml');
        return { code: 0, success: true, signal: null };
      };

      const res = await Profiles.main({ cwd, argv: ['--profile', 'profiles.yaml'] });
      expect(res.kind).to.eql('run');
      expect(Cli.stripAnsi(calls.join('\n'))).to.contain('sys:pi:sandbox');
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

      const res = await Profiles.main({ cwd, argv: ['--allow-all', '--profile', config] });
      expect(res.kind).to.eql('run');
      const printed = Cli.stripAnsi(calls.join('\n'));
      expect(printed).to.match(/permissions\s+allow-all/);
      expect(printed).not.to.match(/\nread\s+/);
      expect(printed).not.to.match(/\nwrite\s+/);
    } finally {
      Process.inherit = prev;
      console.info = prevInfo;
      await Fs.remove(cwd);
    }
  });

  it('records explicit --git-root provenance in the direct-launch report', async () => {
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

      Process.inherit = async () => ({ code: 0, success: true, signal: null });

      const res = await Profiles.main({ cwd, argv: ['--git-root', 'cwd', '--profile', config] });
      const reportDir = Fs.join(cwd, '.pi/@sys/log/@sys.driver-pi') as t.StringDir;
      const reportFiles = (await Fs.ls(reportDir)).filter((path) =>
        path.endsWith('.sandbox.log.md')
      );
      const report = reportFiles[0] ? await Fs.readText(reportFiles[0]) : undefined;
      expect(res.kind).to.eql('run');
      expect(Cli.stripAnsi(calls.join('\n'))).not.to.contain('(--git-root)');
      expect(reportFiles).to.have.length(1);
      expect(report?.data).to.contain('- cwd.git-root: explicit');
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
      expect(printed).to.contain('sys:pi:sandbox');
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
      const reportDir = Fs.join(cwd, '.pi/@sys/log/@sys.driver-pi') as t.StringDir;
      const reportFiles = (await Fs.ls(reportDir)).filter((path) =>
        path.endsWith('.sandbox.log.md')
      );
      const report = reportFiles[0] ? await Fs.readText(reportFiles[0]) : undefined;
      expect(res.kind).to.eql('run');
      const printed = Cli.stripAnsi(calls.join('\n'));
      expect(printed).not.to.contain('canon/AGENTS.md');
      expect(printed).to.contain('sys:pi:sandbox');
      expect(report?.data).to.contain(`- ${contextFile}`);
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
      expect(printed).to.contain('Migrated 2 Pi config/runtime items.');
      expect(printed).to.contain('sys:pi:sandbox');
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
        const check = await ProfilesFs.validateYaml(created);
        expect(check.ok).to.eql(true);
        return { code: 0, success: true, signal: null };
      };

      const res = await Profiles.main({ cwd, argv: ['--profile', 'default', '--', '--help'] });
      expect(res.kind).to.eql('run');
      const printed = Cli.stripAnsi(calls.join('\n'));
      expect(printed).to.contain('sys:pi:sandbox');
      expect(printed).to.contain('.sandbox.log.md');
      expect(printed).not.to.contain('write:cwd');
    } finally {
      Process.inherit = prev;
      console.info = prevInfo;
      await Fs.remove(cwd);
    }
  });
});
