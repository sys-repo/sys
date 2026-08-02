import { describe, expect, it } from '../../../-test.ts';
import { Cli, Fs, type t } from '../common.ts';
import { Process } from '../../m.cli/common.ts';
import { Profiles } from '../mod.ts';

describe(`@sys/driver-pi/cli/Profiles/m.main/menu`, () => {
  it('carries allow-all into the interactive sandbox preview', async () => {
    const prev = Process.inherit;
    const prevInfo = console.info;
    const originalPrompt = Cli.Input.Select.prompt;
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.m.main.test.' }))
      .absolute as t.StringDir;
    const config = `${cwd}/-config/@sys.driver-pi/default.yaml` as t.StringPath;
    const calls: string[] = [];
    let topLevelCount = 0;
    try {
      await Fs.ensureDir(Fs.join(cwd, '.git'));
      await Fs.ensureDir(Fs.dirname(config));
      await Fs.write(config, 'sandbox: {}\n');
      console.info = (value?: unknown) => calls.push(String(value ?? ''));
      Process.inherit = () =>
        Promise.reject(new Error('Process.inherit should not run during sandbox preview.'));
      Object.defineProperty(Cli.Input.Select, 'prompt', {
        value: (input: { message: string; options?: { value: unknown }[] }) => {
          if ((input.options ?? []).some((item) => item.value === 'exit')) {
            topLevelCount += 1;
            if (topLevelCount === 1) return Promise.resolve(config);
            return Promise.resolve('exit');
          }
          if ((input.options ?? []).some((item) => item.value === 'back')) {
            return Promise.resolve('back');
          }
          throw new Error(`Unexpected prompt: ${input.message}`);
        },
      });

      const res = await Profiles.main({ cwd, argv: ['-A'], tty: { stdin: true, stdout: true } });
      expect(res.kind).to.eql('exit');
      const printed = Cli.stripAnsi(calls.join('\n'));
      expect(printed).to.match(/permissions\s+allow-all/);
      expect(printed).not.to.match(/\nread\s+/);
      expect(printed).not.to.match(/\nwrite\s+/);
    } finally {
      Process.inherit = prev;
      console.info = prevInfo;
      Object.defineProperty(Cli.Input.Select, 'prompt', { value: originalPrompt });
      await Fs.remove(cwd);
    }
  });

  it('repaints the terminal with the final sandbox sheet immediately before profile launch', async () => {
    const prev = Process.inherit;
    const prevInfo = console.info;
    const originalPrompt = Cli.Input.Select.prompt;
    const screen = Cli.Screen as { repaint: (frame: string) => void };
    const prevRepaint = screen.repaint;
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.m.main.test.' }))
      .absolute as t.StringDir;
    const config = `${cwd}/-config/@sys.driver-pi/canon.yaml` as t.StringPath;
    const calls: string[] = [];
    const events: string[] = [];
    const frames: string[] = [];
    let topLevelCount = 0;
    let launchCount = 0;
    try {
      await Fs.ensureDir(Fs.join(cwd, '.git'));
      await Fs.ensureDir(Fs.dirname(config));
      await Fs.write(config, 'sandbox: {}\n');
      console.info = (value?: unknown) => calls.push(String(value ?? ''));
      screen.repaint = (frame) => {
        frames.push(frame);
        events.push('repaint');
      };
      Process.inherit = () => {
        launchCount += 1;
        events.push('launch');
        return Promise.resolve({ code: 0, success: true, signal: null });
      };
      Object.defineProperty(Cli.Input.Select, 'prompt', {
        value: (input: { message: string; options?: { value: unknown }[] }) => {
          if ((input.options ?? []).some((item) => item.value === 'exit')) {
            topLevelCount += 1;
            if (topLevelCount === 1) return Promise.resolve(config);
            return Promise.resolve('exit');
          }
          if ((input.options ?? []).some((item) => item.value === 'back')) {
            return Promise.resolve('run');
          }
          throw new Error(`Unexpected prompt: ${input.message}`);
        },
      });

      const res = await Profiles.main({ cwd, tty: { stdin: true, stdout: true } });
      const reportFiles = (await Fs.ls(
        Fs.join(cwd, '.pi', '@sys', 'log', '@sys.driver-pi') as t.StringDir,
      )).filter((path) => path.endsWith('.sandbox.log.md'));
      const printed = Cli.stripAnsi(calls.join('\n'));
      const frame = Cli.stripAnsi(frames.join('\n'));

      expect(res.kind).to.eql('run');
      expect(launchCount).to.eql(1);
      expect(events).to.eql(['repaint', 'launch']);
      expect(frames).to.have.length(1);
      expect(frame).to.contain('sys:pi:sandbox');
      expect(frame).to.match(/permissions\s+scoped/);
      expect(frame).to.contain('.sandbox.log.md');
      expect(printed.match(/permissions\s+scoped/g)?.length).to.eql(1);
      expect(reportFiles.length).to.eql(1);
    } finally {
      Process.inherit = prev;
      console.info = prevInfo;
      screen.repaint = prevRepaint;
      Object.defineProperty(Cli.Input.Select, 'prompt', { value: originalPrompt });
      await Fs.remove(cwd);
    }
  });

  it('writes a new launch report when final caller scope differs from the menu preview', async () => {
    const prev = Process.inherit;
    const prevInfo = console.info;
    const originalPrompt = Cli.Input.Select.prompt;
    const screen = Cli.Screen as { repaint: (frame: string) => void };
    const prevRepaint = screen.repaint;
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.m.main.test.' }))
      .absolute as t.StringDir;
    const config = `${cwd}/-config/@sys.driver-pi/canon.yaml` as t.StringPath;
    const callerRead = Fs.join(cwd, 'caller-read') as t.StringDir;
    const frames: string[] = [];
    let topLevelCount = 0;
    try {
      await Fs.ensureDir(Fs.join(cwd, '.git'));
      await Fs.ensureDir(Fs.dirname(config));
      await Fs.ensureDir(callerRead);
      await Fs.write(config, 'sandbox: {}\n');
      console.info = () => undefined;
      screen.repaint = (frame) => frames.push(frame);
      Process.inherit = () => Promise.resolve({ code: 0, success: true, signal: null });
      Object.defineProperty(Cli.Input.Select, 'prompt', {
        value: (input: { message: string; options?: { value: unknown }[] }) => {
          if ((input.options ?? []).some((item) => item.value === 'exit')) {
            topLevelCount += 1;
            if (topLevelCount === 1) return Promise.resolve(config);
            return Promise.resolve('exit');
          }
          if ((input.options ?? []).some((item) => item.value === 'back')) {
            return Promise.resolve('run');
          }
          throw new Error(`Unexpected prompt: ${input.message}`);
        },
      });

      const res = await Profiles.main({
        cwd,
        read: [callerRead],
        tty: { stdin: true, stdout: true },
      });
      const reportDir = Fs.join(cwd, '.pi/@sys/log/@sys.driver-pi') as t.StringDir;
      const reportFiles = (await Fs.ls(reportDir)).filter((path) =>
        path.endsWith('.sandbox.log.md')
      );
      const reports = await Promise.all(reportFiles.map((path) => Fs.readText(path)));

      expect(res.kind).to.eql('run');
      expect(frames).to.have.length(1);
      expect(reportFiles).to.have.length(2);
      expect(reports.some((report) => report.data?.includes(callerRead))).to.eql(true);
    } finally {
      Process.inherit = prev;
      console.info = prevInfo;
      screen.repaint = prevRepaint;
      Object.defineProperty(Cli.Input.Select, 'prompt', { value: originalPrompt });
      await Fs.remove(cwd);
    }
  });
});
