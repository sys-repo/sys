import { describe, expect, it } from '../../../-test.ts';
import { Cli, Fs, Is, Obj, pkg, type t } from '../common.ts';
import { menu } from '../u/u.menu.ts';
import { ProfilesFs } from '../u/u.fs.ts';
import { PiSandboxFmt } from '../../m.cli/u.fmt.sandbox.ts';
import { Ocr } from '../../m.extension/m.ocr/mod.ts';

describe(`@sys/driver-pi/cli/Profiles/u.menu`, () => {
  it('menu → creates default profile config when none exist', async () => {
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.u.menu.test.' }))
      .absolute as t.StringDir;
    const original = Cli.Input.Select.prompt;
    const prevInfo = console.info;

    await Fs.ensureDir(Fs.join(cwd, '.git'));

    Object.defineProperty(Cli.Input.Select, 'prompt', {
      value: (input: SelectInput) => {
        expect(Obj.hasOwn(input, 'message')).to.eql(false);
        return Promise.resolve('exit');
      },
    });

    console.info = () => undefined;

    try {
      const res = await menu({ cwd: testCwd(cwd) });
      const path = Fs.join(cwd, '-config/@sys.driver-pi/default.yaml');
      const check = await ProfilesFs.validateYaml(path);

      expect(res).to.eql({ kind: 'exit' });
      expect(check.ok).to.eql(true);
    } finally {
      Object.defineProperty(Cli.Input.Select, 'prompt', { value: original });
      console.info = prevInfo;
      await Fs.remove(cwd);
    }
  });

  it('menu → migrates legacy profile dir before rendering profiles', async () => {
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.u.menu.test.' }))
      .absolute as t.StringDir;
    const original = Cli.Input.Select.prompt;
    const prevInfo = console.info;
    const oldConfig = Fs.join(cwd, '-config/@sys.driver-pi.pi/default.yaml');
    const newConfig = Fs.join(cwd, '-config/@sys.driver-pi/default.yaml');
    const calls: string[] = [];

    await Fs.ensureDir(Fs.join(cwd, '.git'));
    await Fs.ensureDir(Fs.dirname(oldConfig));
    await Fs.write(oldConfig, 'sandbox: {}\n');

    Object.defineProperty(Cli.Input.Select, 'prompt', {
      value: (input: SelectInput) => {
        const values = (input.options ?? []).map((item) => item.value);
        expect(values).to.include(newConfig);
        expect(values).not.to.include(oldConfig);
        return Promise.resolve('exit');
      },
    });
    console.info = (value?: unknown) => calls.push(String(value ?? ''));

    try {
      const res = await menu({ cwd: testCwd(cwd) });
      expect(res).to.eql({ kind: 'exit' });
      expect(await Fs.exists(oldConfig)).to.eql(false);
      expect(await Fs.exists(newConfig)).to.eql(true);
      expect(calls.map((value) => Cli.stripAnsi(value))).to.eql([
        expectedProfileHeader('scoped'),
        'Migrated 2 Pi config/runtime items.',
        '',
      ]);
    } finally {
      Object.defineProperty(Cli.Input.Select, 'prompt', { value: original });
      console.info = prevInfo;
      await Fs.remove(cwd);
    }
  });

  it('menu → migrates generated legacy context.include before rendering profiles', async () => {
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.u.menu.test.' }))
      .absolute as t.StringDir;
    const original = Cli.Input.Select.prompt;
    const prevInfo = console.info;
    const config = Fs.join(cwd, '-config/@sys.driver-pi/default.yaml');
    const calls: string[] = [];

    await Fs.ensureDir(Fs.join(cwd, '.git'));
    await Fs.ensureDir(Fs.dirname(config));
    await Fs.write(config, 'sandbox:\n  context:\n    include: []\n');

    Object.defineProperty(Cli.Input.Select, 'prompt', {
      value: () => Promise.resolve('exit'),
    });
    console.info = (value?: unknown) => calls.push(String(value ?? ''));

    try {
      const res = await menu({ cwd: testCwd(cwd) });
      const text = (await Fs.readText(config)).data ?? '';
      expect(res).to.eql({ kind: 'exit' });
      expect(text).to.contain('append: []');
      expect(text).not.to.contain('include:');
      expect(calls.map((value) => Cli.stripAnsi(value))).to.eql([
        expectedProfileHeader('scoped'),
        'Migrated 1 Pi config/runtime item.',
        '',
      ]);
    } finally {
      Object.defineProperty(Cli.Input.Select, 'prompt', { value: original });
      console.info = prevInfo;
      await Fs.remove(cwd);
    }
  });

  it('menu → nests profile actions under selected profile identity', async () => {
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.u.menu.test.' }))
      .absolute as t.StringDir;
    const original = Cli.Input.Select.prompt;
    const prevInfo = console.info;
    const config = Fs.join(cwd, '-config/@sys.driver-pi/default.yaml');

    await Fs.ensureDir(Fs.join(cwd, '.git'));
    let actionFrame: string[] = [];
    let profileFrame: string[] = [];
    let profileTitle = '';
    let topLevelCount = 0;

    Object.defineProperty(Cli.Input.Select, 'prompt', {
      value: (input: SelectInput) => {
        if (isRootMenu(input)) {
          topLevelCount += 1;
          if (topLevelCount === 1) return Promise.resolve(config);
          return Promise.resolve('exit');
        }
        if (isSelectedProfileMenu(input)) {
          const options = input.options ?? [];
          if (actionFrame.length === 0) {
            actionFrame = options.map((item) => Cli.stripAnsi(item.name));
            return Promise.resolve(
              options.find((item) => Cli.stripAnsi(item.name) === '  profile: default')?.value,
            );
          }
          return Promise.resolve('back');
        }
        if (isProfileSubmenu(input)) {
          profileTitle = Cli.stripAnsi(input.message ?? '');
          profileFrame = (input.options ?? []).map((item) => Cli.stripAnsi(item.name));
          return Promise.resolve('back');
        }
        throw new Error(`Unexpected prompt: ${input.message}`);
      },
    });
    console.info = () => undefined;

    try {
      const res = await menu({ cwd: testCwd(cwd) });
      expect(res).to.eql({ kind: 'exit' });
      expect(actionFrame).to.eql(['  start:ui', '  start:cli', '  profile: default', '← back']);
      expect(profileTitle).to.eql('profile: default');
      expect(profileFrame).to.eql([
        '  edit',
        '  reload',
        '  rename',
        ' (delete)',
        '← back',
      ]);
    } finally {
      Object.defineProperty(Cli.Input.Select, 'prompt', { value: original });
      console.info = prevInfo;
      await Fs.remove(cwd);
    }
  });

  it('menu → redraws selected-profile screens across submenu transitions on TTY', async () => {
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.u.menu.test.' }))
      .absolute as t.StringDir;
    const originalPrompt = Cli.Input.Select.prompt;
    const prevInfo = console.info;
    const prevClear = console.clear;
    const prevTerminal = Cli.Is.terminal;
    const screen = Cli.Screen as { size: () => { width: number; height: number } };
    const prevScreenSize = screen.size;
    const config = Fs.join(cwd, '-config/@sys.driver-pi/default.yaml');
    const reportDir = Fs.join(cwd, '.pi/@sys/log/@sys.driver-pi') as t.StringDir;

    const events: string[] = [];
    let rootCount = 0;
    let actionCount = 0;

    try {
      await Fs.ensureDir(Fs.join(cwd, '.git'));
      await Fs.ensureDir(Fs.dirname(config));
      await Fs.write(config, ProfilesFs.initialYaml());

      Object.defineProperty(Cli.Input.Select, 'prompt', {
        value: (input: SelectInput) => {
          if (isRootMenu(input)) {
            events.push('prompt:root');
            rootCount += 1;
            return Promise.resolve(rootCount === 1 ? config : 'exit');
          }
          if (isSelectedProfileMenu(input)) {
            events.push('prompt:action');
            actionCount += 1;
            if (actionCount === 1) {
              const option = input.options?.find((item) =>
                Cli.stripAnsi(item.name) === '  profile: default'
              );
              if (Is.nil(option)) throw new Error('Selected-profile submenu option is missing.');
              return Promise.resolve(option.value);
            }
            return Promise.resolve('back');
          }
          if (isProfileSubmenu(input)) {
            events.push('prompt:submenu');
            return Promise.resolve('back');
          }
          throw new Error(`Unexpected prompt: ${input.message}`);
        },
      });
      Object.defineProperty(Cli.Is, 'terminal', {
        value: (stream: t.StdioName) => stream === 'stdout',
        configurable: true,
        writable: true,
      });
      screen.size = () => ({ width: 80, height: 24 });
      console.clear = () => events.push('clear');
      console.info = (value?: unknown) => {
        const text = Cli.stripAnsi(String(value ?? ''));
        if (text.includes('.sandbox.log.md')) {
          events.push('screen:sandbox');
          return;
        }
        if (text === expectedProfileHeader('scoped')) {
          events.push('screen:root');
          return;
        }
        if (text === '') {
          events.push('screen:gap');
          return;
        }
        throw new Error(`Unexpected screen output:\n${text}`);
      };

      const res = await menu({ cwd: testCwd(cwd) });
      const reports = (await Fs.ls(reportDir)).filter((path) => path.endsWith('.sandbox.log.md'));

      expect(res).to.eql({ kind: 'exit' });
      expect(reports).to.have.length(1);
      expect(events).to.eql([
        'clear',
        'screen:root',
        'screen:gap',
        'prompt:root',
        'clear',
        'screen:sandbox',
        'prompt:action',
        'clear',
        'screen:sandbox',
        'prompt:submenu',
        'clear',
        'screen:sandbox',
        'prompt:action',
        'clear',
        'screen:root',
        'screen:gap',
        'prompt:root',
      ]);
    } finally {
      Object.defineProperty(Cli.Input.Select, 'prompt', { value: originalPrompt });
      Object.defineProperty(Cli.Is, 'terminal', {
        value: prevTerminal,
        configurable: true,
        writable: true,
      });
      screen.size = prevScreenSize;
      console.clear = prevClear;
      console.info = prevInfo;
      await Fs.remove(cwd);
    }
  });

  it('menu → keeps invalid-profile root actions titleless', async () => {
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.u.menu.test.' }))
      .absolute as t.StringDir;
    const original = Cli.Input.Select.prompt;
    const prevInfo = console.info;
    const config = Fs.join(cwd, '-config/@sys.driver-pi/default.yaml');
    const hasMessages: boolean[] = [];
    const prints: string[] = [];
    let topLevelCount = 0;

    await Fs.ensureDir(Fs.join(cwd, '.git'));
    await Fs.ensureDir(Fs.dirname(config));
    await Fs.write(config, 'sandbox: [\n');

    Object.defineProperty(Cli.Input.Select, 'prompt', {
      value: (input: SelectInput) => {
        hasMessages.push(Obj.hasOwn(input, 'message'));
        if (isRootMenu(input)) {
          topLevelCount += 1;
          if (topLevelCount === 1) return Promise.resolve(config);
          return Promise.resolve('exit');
        }
        if (isActionMenu(input)) return Promise.resolve('back');
        throw new Error(`Unexpected prompt: ${input.message}`);
      },
    });
    console.info = (value?: unknown) => prints.push(String(value ?? ''));

    try {
      const res = await menu({ cwd: testCwd(cwd) });
      expect(res).to.eql({ kind: 'exit' });
      expect(hasMessages).to.eql([false, false, false]);
      expect(prints.map((value) => Cli.stripAnsi(value))).to.eql([
        expectedProfileHeader('scoped'),
        '',
        expectedProfileHeader('scoped'),
        expectedProfileHeader('scoped'),
        '',
      ]);
    } finally {
      Object.defineProperty(Cli.Input.Select, 'prompt', { value: original });
      console.info = prevInfo;
      await Fs.remove(cwd);
    }
  });

  it('menu → shows the sandbox sheet before selected-profile actions', async () => {
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.u.menu.test.' }))
      .absolute as t.StringDir;
    const original = Cli.Input.Select.prompt;
    const prevInfo = console.info;
    const config = Fs.join(cwd, '-config/@sys.driver-pi/default.yaml');
    const reportDir = Fs.join(cwd, '.pi/@sys/log/@sys.driver-pi') as t.StringDir;

    await Fs.ensureDir(Fs.join(cwd, '.git'));
    const prints: string[] = [];
    let topLevelCount = 0;
    let actionObservedPersistedReport = false;

    Object.defineProperty(Cli.Input.Select, 'prompt', {
      value: async (input: SelectInput) => {
        if (isRootMenu(input)) {
          topLevelCount += 1;
          if (topLevelCount === 1) return config;
          return 'exit';
        }
        if (isActionMenu(input)) {
          const files = await Fs.ls(reportDir);
          actionObservedPersistedReport = files.some((path) => path.endsWith('.sandbox.log.md'));
          return 'back';
        }
        throw new Error(`Unexpected prompt: ${input.message}`);
      },
    });
    console.info = (value?: unknown) => prints.push(String(value ?? ''));

    try {
      const res = await menu({ cwd: testCwd(cwd), gitRootExplicit: true });
      const printed = Cli.stripAnsi(prints.join('\n'));
      const reportFiles = (await Fs.ls(reportDir)).filter((path) =>
        path.endsWith('.sandbox.log.md')
      );
      const report = reportFiles[0] ? await Fs.readText(reportFiles[0]) : undefined;
      expect(res).to.eql({ kind: 'exit' });
      expect(prints.filter((value) => value === '')).to.have.length(2);
      expect(prints.filter((value) => value.includes('.sandbox.log.md'))).to.have.length(1);
      expect(printed).to.contain('sys:pi:sandbox');
      expect(printed).to.match(/permissions\s+scoped/);
      expect(printed).to.match(/report\s+.*\.sandbox\.log\.md/);
      expect(printed).to.not.contain(`${cwd}/.log`);
      expect(printed).to.contain('.sandbox.log.md');
      expect(printed).not.to.match(/\ncontext\s+/);
      expect(reportFiles).to.have.length(1);
      expect(actionObservedPersistedReport).to.eql(true);
      expect(report?.data).to.contain('- cwd.git-root: explicit');
      expect(printed).not.to.match(/\nread\s+/);
      expect(printed).not.to.contain('write:cwd');
    } finally {
      Object.defineProperty(Cli.Input.Select, 'prompt', { value: original });
      console.info = prevInfo;
      await Fs.remove(cwd);
    }
  });

  it('menu → clears and restores the root header initially and after back on TTY', async () => {
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.u.menu.test.' }))
      .absolute as t.StringDir;
    const originalPrompt = Cli.Input.Select.prompt;
    const prevInfo = console.info;
    const prevClear = console.clear;
    const prevTerminal = Cli.Is.terminal;
    const screen = Cli.Screen as { size: () => { width: number; height: number } };
    const prevScreenSize = screen.size;
    const config = Fs.join(cwd, '-config/@sys.driver-pi/default.yaml');

    await Fs.ensureDir(Fs.join(cwd, '.git'));
    await Fs.ensureDir(Fs.dirname(config));
    await Fs.write(config, 'sandbox: {}\n');
    const events: string[] = [];
    let topLevelCount = 0;

    Object.defineProperty(Cli.Input.Select, 'prompt', {
      value: (input: SelectInput) => {
        if (isRootMenu(input)) {
          events.push('root:prompt');
          topLevelCount += 1;
          if (topLevelCount === 1) return Promise.resolve(config);
          return Promise.resolve('exit');
        }
        if (isActionMenu(input)) {
          events.push('action:prompt');
          return Promise.resolve('back');
        }
        throw new Error(`Unexpected prompt: ${input.message}`);
      },
    });
    Object.defineProperty(Cli.Is, 'terminal', {
      value: (stream: t.StdioName) => stream === 'stdout',
      configurable: true,
      writable: true,
    });
    screen.size = () => ({ width: 80, height: 24 });
    console.clear = () => events.push('clear');
    console.info = (value?: unknown) => {
      const text = Cli.stripAnsi(String(value ?? ''));
      if (text === expectedProfileHeader('scoped')) events.push('root:header');
      if (text === '') events.push('root:gap');
      if (text.includes('.sandbox.log.md')) events.push('sandbox:sheet');
    };

    try {
      const res = await menu({ cwd: testCwd(cwd) });
      expect(res).to.eql({ kind: 'exit' });
      expect(events).to.eql([
        'clear',
        'root:header',
        'root:gap',
        'root:prompt',
        'clear',
        'sandbox:sheet',
        'action:prompt',
        'clear',
        'root:header',
        'root:gap',
        'root:prompt',
      ]);
    } finally {
      Object.defineProperty(Cli.Input.Select, 'prompt', { value: originalPrompt });
      Object.defineProperty(Cli.Is, 'terminal', {
        value: prevTerminal,
        configurable: true,
        writable: true,
      });
      screen.size = prevScreenSize;
      console.clear = prevClear;
      console.info = prevInfo;
      await Fs.remove(cwd);
    }
  });

  it('menu → keeps loaded standard context files in the report, not the sandbox sheet', async () => {
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.u.menu.test.' }))
      .absolute as t.StringDir;
    const original = Cli.Input.Select.prompt;
    const prevInfo = console.info;
    const config = Fs.join(cwd, '-config/@sys.driver-pi/default.yaml');

    await Fs.ensureDir(Fs.join(cwd, '.git'));
    await Fs.write(Fs.join(cwd, 'AGENTS.md'), 'Agent guidance.');
    await Fs.write(Fs.join(cwd, 'SYSTEM.md'), 'System guidance.');
    const prints: string[] = [];
    let topLevelCount = 0;

    Object.defineProperty(Cli.Input.Select, 'prompt', {
      value: (input: SelectInput) => {
        if (isRootMenu(input)) {
          topLevelCount += 1;
          if (topLevelCount === 1) return Promise.resolve(config);
          return Promise.resolve('exit');
        }
        if (isActionMenu(input)) return Promise.resolve('back');
        throw new Error(`Unexpected prompt: ${input.message}`);
      },
    });
    console.info = (value?: unknown) => prints.push(String(value ?? ''));

    try {
      const res = await menu({ cwd: testCwd(cwd) });
      const printed = Cli.stripAnsi(prints.join('\n'));
      const reportDir = Fs.join(cwd, '.pi/@sys/log/@sys.driver-pi') as t.StringDir;
      const reportFiles = (await Fs.ls(reportDir)).filter((path) =>
        path.endsWith('.sandbox.log.md')
      );
      const report = reportFiles[0] ? await Fs.readText(reportFiles[0]) : undefined;
      expect(res).to.eql({ kind: 'exit' });
      expect(printed).not.to.match(/\ncontext\s+/);
      expect(reportFiles).to.have.length(1);
      expect(report?.data).to.contain(`- ${Fs.join(cwd, 'AGENTS.md')}`);
      expect(report?.data).to.contain(`- ${Fs.join(cwd, 'SYSTEM.md')}`);
    } finally {
      Object.defineProperty(Cli.Input.Select, 'prompt', { value: original });
      console.info = prevInfo;
      await Fs.remove(cwd);
    }
  });

  it('menu → sandbox preview does not run OCR preflight or setup', async () => {
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.u.menu.test.' }))
      .absolute as t.StringDir;
    const originalPrompt = Cli.Input.Select.prompt;
    const originalDependencies = Ocr.Resolve.dependencies;
    const prevInfo = console.info;
    const config = Fs.join(cwd, '-config/@sys.driver-pi/default.yaml');
    let preflightRan = false;
    let topLevelCount = 0;

    await Fs.ensureDir(Fs.join(cwd, '.git'));
    await Fs.ensureDir(Fs.dirname(config));
    await Fs.write(
      config,
      `tools:\n  remove:\n    enabled: false\n  move:\n    enabled: false\n  copy:\n    enabled: false\n  ocr:\n    pdf:\n      enabled: true\n`,
    );

    Object.defineProperty(Cli.Input.Select, 'prompt', {
      value: (input: SelectInput) => {
        if (isRootMenu(input)) {
          topLevelCount += 1;
          if (topLevelCount === 1) return Promise.resolve(config);
          return Promise.resolve('exit');
        }
        if (isActionMenu(input)) return Promise.resolve('back');
        throw new Error(`Unexpected prompt: ${input.message}`);
      },
    });
    Object.defineProperty(Ocr.Resolve, 'dependencies', {
      value: () => {
        preflightRan = true;
        throw new Error('OCR preflight must not run during menu preview.');
      },
      configurable: true,
      writable: true,
    });
    console.info = () => undefined;

    try {
      const res = await menu({ cwd: testCwd(cwd) });
      expect(res).to.eql({ kind: 'exit' });
      expect(preflightRan).to.eql(false);
    } finally {
      Object.defineProperty(Cli.Input.Select, 'prompt', { value: originalPrompt });
      Object.defineProperty(Ocr.Resolve, 'dependencies', {
        value: originalDependencies,
        configurable: true,
        writable: true,
      });
      console.info = prevInfo;
      await Fs.remove(cwd);
    }
  });

  it('menu → sandbox preview preserves explicit allow-all posture', async () => {
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.u.menu.test.' }))
      .absolute as t.StringDir;
    const original = Cli.Input.Select.prompt;
    const prevInfo = console.info;
    const config = Fs.join(cwd, '-config/@sys.driver-pi/default.yaml');

    await Fs.ensureDir(Fs.join(cwd, '.git'));
    await Fs.ensureDir(Fs.dirname(config));
    await Fs.write(config, 'sandbox: {}\n');
    const prints: string[] = [];
    const harnessOptions: string[] = [];
    let topLevelCount = 0;

    Object.defineProperty(Cli.Input.Select, 'prompt', {
      value: (input: SelectInput) => {
        if (isRootMenu(input)) {
          topLevelCount += 1;
          if (topLevelCount === 1) return Promise.resolve(config);
          return Promise.resolve('exit');
        }
        if (isActionMenu(input)) {
          harnessOptions.push(...(input.options ?? []).map((item) => item.name));
          return Promise.resolve('back');
        }
        throw new Error(`Unexpected prompt: ${input.message}`);
      },
    });
    console.info = (value?: unknown) => prints.push(String(value ?? ''));

    try {
      const res = await menu({ cwd: testCwd(cwd), allowAll: true });
      const printed = Cli.stripAnsi(prints.join('\n'));
      const rootHeader = Cli.stripAnsi(prints[0] ?? '');
      expect(res).to.eql({ kind: 'exit' });
      expect(rootHeader).to.eql(expectedProfileHeader('allow-all'));
      expect(rootHeader).to.contain('sys:pi:no-sandbox --allow-all');
      expect(rootHeader).to.contain(`read, write, bash · ${pkg.version}`);
      expect(printed).to.match(/permissions\s+allow-all/);
      expect(printed).not.to.match(/\nread\s+/);
      expect(printed).not.to.match(/\nwrite\s+/);
      const strippedOptions = harnessOptions.map((name) => Cli.stripAnsi(name));
      expect(strippedOptions).to.include('  start:cli');
      expect(strippedOptions).to.include('  start:ui');
    } finally {
      Object.defineProperty(Cli.Input.Select, 'prompt', { value: original });
      console.info = prevInfo;
      await Fs.remove(cwd);
    }
  });
});

type SelectInput = {
  readonly message?: string;
  readonly options?: readonly { readonly name: string; readonly value: unknown }[];
};

function expectedProfileHeader(permissions: t.PiCli.PermissionMode) {
  return Cli.stripAnsi(PiSandboxFmt.header(permissions).join('\n'));
}

function testCwd(cwd: t.StringDir): t.PiCli.Cwd {
  return { invoked: cwd, git: cwd };
}

function isRootMenu(input: SelectInput) {
  return (input.options ?? []).some((item) => item.value === 'exit');
}

function isActionMenu(input: SelectInput) {
  return (input.options ?? []).some((item) => item.value === 'back');
}

function isSelectedProfileMenu(input: SelectInput) {
  return (input.options ?? []).some((item) => item.value === 'start:cli') ||
    (input.options ?? []).some((item) => item.value === 'start:ui');
}

function isProfileSubmenu(input: SelectInput) {
  const options = input.options ?? [];
  return options.some((item) => item.value === 'edit') &&
    !(options.some((item) => item.value === 'start:cli') ||
      options.some((item) => item.value === 'start:ui'));
}
