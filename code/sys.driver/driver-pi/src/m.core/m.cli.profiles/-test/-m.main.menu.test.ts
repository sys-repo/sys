import { describe, expect, it } from '../../../-test.ts';
import { Cli, Fs, Obj, type t } from '../common.ts';
import { Process } from '../../m.cli/common.ts';
import { mainWith } from '../m.main.ts';
import { Profiles } from '../mod.ts';
import { START_GUI_SERVICE } from '../u/u.start.gui.service.ts';

type SelectPromptInput = {
  readonly message?: string;
  readonly options?: readonly { readonly value: unknown }[];
};

describe(`@sys/driver-pi/cli/Profiles/m.main/menu`, () => {
  it('keeps profile prompts titleless while carrying allow-all into the sandbox preview', async () => {
    const prev = Process.inherit;
    const prevInfo = console.info;
    const originalPrompt = Cli.Input.Select.prompt;
    const prefix = 'driver-pi.profiles.m.main.test.';
    const cwd = (await Fs.makeTempDir({ prefix })).absolute as t.StringDir;
    const config = `${cwd}/-config/@sys.driver-pi/default.yaml` as t.StringPath;
    const calls: string[] = [];
    const prompts: Array<{ kind: 'profiles' | 'actions'; hasMessage: boolean }> = [];
    let topLevelCount = 0;
    try {
      await Fs.ensureDir(Fs.join(cwd, '.git'));
      await Fs.ensureDir(Fs.dirname(config));
      await Fs.write(config, 'sandbox: {}\n');
      console.info = (value?: unknown) => calls.push(String(value ?? ''));
      Process.inherit = () =>
        Promise.reject(new Error('Process.inherit should not run during sandbox preview.'));
      Object.defineProperty(Cli.Input.Select, 'prompt', {
        value: (input: SelectPromptInput) => {
          if ((input.options ?? []).some((item) => item.value === 'exit')) {
            prompts.push({ kind: 'profiles', hasMessage: Obj.hasOwn(input, 'message') });
            topLevelCount += 1;
            if (topLevelCount === 1) return Promise.resolve(config);
            return Promise.resolve('exit');
          }
          if ((input.options ?? []).some((item) => item.value === 'back')) {
            prompts.push({ kind: 'actions', hasMessage: Obj.hasOwn(input, 'message') });
            return Promise.resolve('back');
          }
          throw new Error(`Unexpected prompt: ${input.message}`);
        },
      });

      const res = await Profiles.main({ cwd, argv: ['-A'], tty: { stdin: true, stdout: true } });
      expect(res.kind).to.eql('exit');
      expect(prompts).to.eql([
        { kind: 'profiles', hasMessage: false },
        { kind: 'actions', hasMessage: false },
        { kind: 'profiles', hasMessage: false },
      ]);
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
    const prefix = 'driver-pi.profiles.m.main.test.';
    const cwd = (await Fs.makeTempDir({ prefix })).absolute as t.StringDir;
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
        value: (input: SelectPromptInput) => {
          if ((input.options ?? []).some((item) => item.value === 'exit')) {
            topLevelCount += 1;
            if (topLevelCount === 1) return Promise.resolve(config);
            return Promise.resolve('exit');
          }
          if ((input.options ?? []).some((item) => item.value === 'back')) {
            return Promise.resolve('start:tui');
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
    const prefix = 'driver-pi.profiles.m.main.test.';
    const cwd = (await Fs.makeTempDir({ prefix })).absolute as t.StringDir;
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
        value: (input: SelectPromptInput) => {
          if ((input.options ?? []).some((item) => item.value === 'exit')) {
            topLevelCount += 1;
            if (topLevelCount === 1) return Promise.resolve(config);
            return Promise.resolve('exit');
          }
          if ((input.options ?? []).some((item) => item.value === 'back')) {
            return Promise.resolve('start:tui');
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

  it('rejects passthrough args when start:gui is selected', async () => {
    const prev = Process.inherit;
    const prevInfo = console.info;
    const originalPrompt = Cli.Input.Select.prompt;
    const prefix = 'driver-pi.profiles.m.main.test.';
    const cwd = (await Fs.makeTempDir({ prefix })).absolute as t.StringDir;
    const config = `${cwd}/-config/@sys.driver-pi/canon.yaml` as t.StringPath;

    let topLevelCount = 0;
    let selectedAction: string | undefined;

    await Fs.ensureDir(Fs.join(cwd, '.git'));
    await Fs.ensureDir(Fs.dirname(config));
    await Fs.write(config, 'sandbox: {}\n');

    console.info = () => undefined;
    Process.inherit = () => Promise.resolve({ code: 0, success: true, signal: null });

    Object.defineProperty(Cli.Input.Select, 'prompt', {
      value: (input: SelectPromptInput) => {
        if ((input.options ?? []).some((item) => item.value === 'exit')) {
          topLevelCount += 1;
          if (topLevelCount === 1) return Promise.resolve(config);
          return Promise.resolve('exit');
        }
        if (
          selectedAction == null && (input.options ?? []).some((item) => item.value === 'start:gui')
        ) {
          selectedAction = 'action';
          return Promise.resolve('start:gui');
        }
        if (
          selectedAction === 'action' && (input.options ?? []).some((item) => item.value === 'back')
        ) {
          return Promise.resolve('back');
        }
        if ((input.options ?? []).some((item) => item.value === 'back')) {
          return Promise.resolve('back');
        }
        throw new Error(`Unexpected prompt: ${input.message}`);
      },
    });

    try {
      let err: Error | undefined;
      try {
        await Profiles.main({ cwd, argv: ['--', '--help'], tty: { stdin: true, stdout: true } });
      } catch (error) {
        err = error instanceof Error ? error : new Error(String(error));
      }
      expect(err?.message).to.eql(
        'start:gui cannot accept Pi passthrough args. Select start:tui for passthrough mode.',
      );
    } finally {
      Process.inherit = prev;
      console.info = prevInfo;
      Object.defineProperty(Cli.Input.Select, 'prompt', { value: originalPrompt });
      await Fs.remove(cwd);
    }
  });

  it('dispatches start:gui without launching a Pi child or rendering final child authority', async () => {
    const prev = Process.inherit;
    const prevInfo = console.info;
    const originalPrompt = Cli.Input.Select.prompt;
    const screen = Cli.Screen as { repaint: (frame: string) => void };
    const prevRepaint = screen.repaint;
    const prefix = 'driver-pi.profiles.m.main.test.';
    const cwd = (await Fs.makeTempDir({ prefix })).absolute as t.StringDir;
    const config = `${cwd}/-config/@sys.driver-pi/canon.yaml` as t.StringPath;
    const frames: string[] = [];
    let topLevelCount = 0;
    let selectedAction: string | undefined;
    let startGuiCalls = 0;
    let startGuiInput: {
      cwd: t.PiCli.Cwd;
      source: t.PiCliProfiles.StartGuiSource;
    } | undefined;

    await Fs.ensureDir(Fs.join(cwd, '.git'));
    await Fs.ensureDir(Fs.dirname(config));
    await Fs.write(config, 'sandbox: {}\n');

    console.info = () => undefined;
    screen.repaint = (frame) => frames.push(frame);
    Process.inherit = () =>
      Promise.reject(new Error('Process.inherit should not run during start:gui'));

    Object.defineProperty(Cli.Input.Select, 'prompt', {
      value: (input: SelectPromptInput) => {
        if ((input.options ?? []).some((item) => item.value === 'exit')) {
          topLevelCount += 1;
          if (topLevelCount === 1) return Promise.resolve(config);
          return Promise.resolve('exit');
        }
        if (
          selectedAction == null && (input.options ?? []).some((item) => item.value === 'start:gui')
        ) {
          selectedAction = 'action';
          return Promise.resolve('start:gui');
        }
        if (
          selectedAction === 'action' && (input.options ?? []).some((item) => item.value === 'back')
        ) {
          return Promise.resolve('back');
        }
        if ((input.options ?? []).some((item) => item.value === 'back')) {
          return Promise.resolve('back');
        }
        throw new Error(`Unexpected prompt: ${input.message}`);
      },
    });

    try {
      const res = await mainWith(
        { cwd, tty: { stdin: true, stdout: true } },
        {
          startGui: (input) => {
            startGuiCalls += 1;
            startGuiInput = input;
            return Promise.resolve();
          },
        },
      );

      expect(res.kind).to.eql('gui');
      expect(startGuiCalls).to.eql(1);
      expect(startGuiInput?.cwd.git).to.eql(cwd);
      expect(startGuiInput?.cwd.invoked).to.eql(cwd);
      expect(startGuiInput?.source).to.equal(START_GUI_SERVICE.source);
      expect(frames).to.have.length(1);
      expect(Cli.stripAnsi(frames[0] ?? '')).to.not.contain('start:gui');
    } finally {
      Process.inherit = prev;
      console.info = prevInfo;
      screen.repaint = prevRepaint;
      Object.defineProperty(Cli.Input.Select, 'prompt', { value: originalPrompt });
      await Fs.remove(cwd);
    }
  });
});
