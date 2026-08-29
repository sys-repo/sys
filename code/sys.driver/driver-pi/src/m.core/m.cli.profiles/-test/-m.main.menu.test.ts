import { describe, expect, it, withSelectPrompt } from '../../../-test.ts';
import { Cli as CliOwner, Fs, Obj, Str, type t } from '../common.ts';
import { Process as ProcessOwner } from '../../m.cli/common.ts';
import { mainWith as mainWithOwner } from '../m.main.ts';
import { Profiles as ProfilesOwner } from '../mod.ts';
import {
  markCliSettledFailure,
  type StartGuiCompletion,
  startGuiCompletion,
} from '../u/u.start.gui.settlement.ts';
import { START_GUI_SERVICE, type StartGuiEvidence } from '../u/u.start.gui.service.ts';
import { withInherit } from '../../m.cli/u.inherit.ts';

const Cli = {
  ...CliOwner,
  Input: { ...CliOwner.Input, Select: { ...CliOwner.Input.Select } },
  Screen: { ...CliOwner.Screen },
};
const Process = { ...ProcessOwner };
const withEffects = <T>(run: () => T): T =>
  withSelectPrompt(
    (options) => Cli.Input.Select.prompt(options as never) as Promise<unknown>,
    () => withInherit(Process.inherit, run),
  );
const Profiles = {
  ...ProfilesOwner,
  main: (input: Parameters<typeof ProfilesOwner.main>[0]) =>
    withEffects(() =>
      mainWithOwner(input, {
        repaint: Cli.Screen.repaint,
        startGui: () => Promise.reject(new Error('Unexpected start:gui dispatch.')),
      })
    ),
};
type MainWithDeps = NonNullable<Parameters<typeof mainWithOwner>[1]>;
const mainWith = (
  input: Parameters<typeof mainWithOwner>[0],
  deps: Pick<MainWithDeps, 'startGui'>,
) => withEffects(() => mainWithOwner(input, { ...deps, repaint: Cli.Screen.repaint }));

type SelectPromptInput = {
  readonly message?: string;
  readonly options?: readonly { readonly value: unknown }[];
};

function mainWithPrompt(
  input: Parameters<typeof mainWithOwner>[0],
  deps: Pick<MainWithDeps, 'repaint' | 'startGui'>,
  prompt: (input: SelectPromptInput) => Promise<unknown>,
  inherit: typeof Process.inherit,
) {
  return withSelectPrompt(
    (options) => prompt(options as SelectPromptInput),
    () => withInherit(inherit, () => mainWithOwner(input, deps)),
  );
}

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
      source: StartGuiEvidence;
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
            return Promise.resolve(startGuiCompletion('quit'));
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

  it('reopens the same action menu with current profile bytes and sequential GUI owners', async () => {
    await withGuiMenuRoot('driver-pi.profiles.m.main.back.test.', async ({ cwd, config }) => {
      const changedRead = Fs.join(cwd, 'changed-while-gui-ran') as t.StringDir;
      const prompts: Array<'profiles' | 'actions'> = [];
      const frames: string[] = [];
      const sessions: string[] = [];
      let actionCount = 0;
      let activeSessions = 0;
      let sessionCount = 0;
      let tuiLaunches = 0;
      await Fs.ensureDir(changedRead);

      const result = await mainWithPrompt(
        { cwd, tty: { stdin: true, stdout: true } },
        {
          repaint: (frame) => frames.push(Cli.stripAnsi(frame)),
          async startGui() {
            activeSessions += 1;
            expect(activeSessions).to.eql(1);
            const session = ++sessionCount;
            sessions.push(`start:${session}`);
            try {
              if (session === 1) {
                await Fs.write(
                  config,
                  Str.dedent(`
                    sandbox:
                      capability:
                        read:
                          - ${changedRead}
                  `),
                );
              }
              return startGuiCompletion('back');
            } finally {
              sessions.push(`stop:${session}`);
              activeSessions -= 1;
            }
          },
        },
        (input) => {
          if ((input.options ?? []).some((item) => item.value === 'exit')) {
            prompts.push('profiles');
            return Promise.resolve(config);
          }
          if ((input.options ?? []).some((item) => item.value === 'back')) {
            prompts.push('actions');
            actionCount += 1;
            return Promise.resolve(actionCount <= 2 ? 'start:gui' : 'start:tui');
          }
          throw new Error(`Unexpected prompt: ${input.message}`);
        },
        () => {
          tuiLaunches += 1;
          return Promise.resolve({ code: 0, success: true, signal: null });
        },
      );

      const reportDir = Fs.join(cwd, '.pi/@sys/log/@sys.driver-pi') as t.StringDir;
      const reportFiles = (await Fs.ls(reportDir)).filter((path) =>
        path.endsWith('.sandbox.log.md')
      );
      const reports = await Promise.all(reportFiles.map((path) => Fs.readText(path)));

      expect(result.kind).to.eql('run');
      expect(tuiLaunches).to.eql(1);
      expect(prompts).to.eql(['profiles', 'actions', 'actions', 'actions']);
      expect(sessions).to.eql(['start:1', 'stop:1', 'start:2', 'stop:2']);
      expect(frames).to.have.length(3);
      expect(frames[0]).not.to.eql(frames[1]);
      expect(reports.some((report) => report.data?.includes(changedRead))).to.eql(true);
    });
  });

  it('never reopens the action menu for forged completions or rejected GUI runs', async () => {
    const ordinary = new Error('ordinary start:gui rejection');
    const settled = new Error('settled start:gui rejection');
    markCliSettledFailure(settled);
    const cases = [
      {
        label: 'forged completion',
        startGui: () => Promise.resolve(Object.freeze({ kind: 'back' }) as StartGuiCompletion),
        message: 'start:gui completion invalid.',
      },
      { label: 'ordinary rejection', startGui: () => Promise.reject(ordinary), error: ordinary },
      { label: 'settled rejection', startGui: () => Promise.reject(settled), error: settled },
    ] as const;

    for (const testCase of cases) {
      await withGuiMenuRoot(
        `driver-pi.profiles.m.main.${testCase.label.replace(' ', '-')}.test.`,
        async ({ cwd, config }) => {
          let actionPrompts = 0;
          let observed: unknown;
          try {
            await mainWithPrompt(
              { cwd, tty: { stdin: true, stdout: true } },
              { repaint() {}, startGui: testCase.startGui },
              (input) => {
                if ((input.options ?? []).some((item) => item.value === 'exit')) {
                  return Promise.resolve(config);
                }
                if ((input.options ?? []).some((item) => item.value === 'back')) {
                  actionPrompts += 1;
                  if (actionPrompts > 1) throw new Error('Unexpected second action prompt.');
                  return Promise.resolve('start:gui');
                }
                throw new Error(`Unexpected prompt: ${input.message}`);
              },
              () => Promise.reject(new Error('Process.inherit must not run.')),
            );
          } catch (cause) {
            observed = cause;
          }

          expect(actionPrompts, testCase.label).to.eql(1);
          if ('error' in testCase) expect(observed, testCase.label).to.equal(testCase.error);
          else expect((observed as Error)?.message, testCase.label).to.eql(testCase.message);
        },
      );
    }
  });
});

async function withGuiMenuRoot<T>(
  prefix: string,
  run: (fixture: { cwd: t.StringDir; config: t.StringPath }) => Promise<T>,
): Promise<T> {
  const previousInfo = console.info;
  const cwd = (await Fs.makeTempDir({ prefix })).absolute as t.StringDir;
  const config = `${cwd}/-config/@sys.driver-pi/canon.yaml` as t.StringPath;
  try {
    await Fs.ensureDir(Fs.join(cwd, '.git'));
    await Fs.ensureDir(Fs.dirname(config));
    await Fs.write(config, 'sandbox: {}\n');
    console.info = () => undefined;
    return await run({ cwd, config });
  } finally {
    console.info = previousInfo;
    await Fs.remove(cwd);
  }
}
