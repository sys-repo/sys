import { describe, expect, it } from '../../../-test.ts';
import { Cli, Fs, type t } from '../common.ts';
import { menu } from '../u.menu.ts';

describe(`@sys/driver-pi/cli/Profiles/u.menu`, () => {
  it('menu → creates default profile config when none exist', async () => {
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.u.menu.test.' }))
      .absolute as t.StringDir;
    const original = Cli.Input.Select.prompt;

    await Fs.ensureDir(Fs.join(cwd, '.git'));

    Object.defineProperty(Cli.Input.Select, 'prompt', {
      value: (input: { message: string }) => {
        expect(input.message).to.eql('agent:');
        return Promise.resolve('exit');
      },
    });

    try {
      const res = await menu({ cwd });
      const path = Fs.join(cwd, '-config/@sys.driver-pi/default.yaml');
      const read = await Fs.readText(path);
      expect(read.ok).to.eql(true);
      const text = read.data ?? '';

      expect(res).to.eql({ kind: 'exit' });
      expect(text).to.contain('# pi profile: default');
      expect(text).to.contain('# Typed Pi launcher policy.');
      expect(text).to.contain('prompt:');
      expect(text).to.contain('sandbox:');
    } finally {
      Object.defineProperty(Cli.Input.Select, 'prompt', { value: original });
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
      const res = await menu({ cwd });
      expect(res).to.eql({ kind: 'exit' });
      expect(await Fs.exists(oldConfig)).to.eql(false);
      expect(await Fs.exists(newConfig)).to.eql(true);
      expect(calls).to.eql(['Migrated 2 Pi config/runtime items.']);
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
      const res = await menu({ cwd });
      const text = (await Fs.readText(config)).data ?? '';
      expect(res).to.eql({ kind: 'exit' });
      expect(text).to.contain('append: []');
      expect(text).not.to.contain('include:');
      expect(calls).to.eql(['Migrated 1 Pi config/runtime item.']);
    } finally {
      Object.defineProperty(Cli.Input.Select, 'prompt', { value: original });
      console.info = prevInfo;
      await Fs.remove(cwd);
    }
  });

  it('menu → uses agent: for the action prompt', async () => {
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.u.menu.test.' }))
      .absolute as t.StringDir;
    const original = Cli.Input.Select.prompt;
    const prevInfo = console.info;
    const config = Fs.join(cwd, '-config/@sys.driver-pi/default.yaml');

    await Fs.ensureDir(Fs.join(cwd, '.git'));
    const calls: string[] = [];
    const harnessOptions: string[] = [];
    let topLevelCount = 0;

    Object.defineProperty(Cli.Input.Select, 'prompt', {
      value: (input: SelectInput) => {
        calls.push(input.message);
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
    console.info = () => undefined;

    try {
      const res = await menu({ cwd });
      expect(res).to.eql({ kind: 'exit' });
      const strippedOptions = harnessOptions.map((name) => Cli.stripAnsi(name));
      expect(calls).to.eql(['agent:', 'agent:', 'agent:']);
      expect(strippedOptions).to.include('  start');
    } finally {
      Object.defineProperty(Cli.Input.Select, 'prompt', { value: original });
      console.info = prevInfo;
      await Fs.remove(cwd);
    }
  });

  it('menu → shows the sandbox sheet before the action menu and keeps one reload action', async () => {
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.u.menu.test.' }))
      .absolute as t.StringDir;
    const original = Cli.Input.Select.prompt;
    const prevInfo = console.info;
    const config = Fs.join(cwd, '-config/@sys.driver-pi/default.yaml');

    await Fs.ensureDir(Fs.join(cwd, '.git'));
    const prompts: string[] = [];
    const prints: string[] = [];
    const harnessOptions: string[] = [];
    let topLevelCount = 0;

    Object.defineProperty(Cli.Input.Select, 'prompt', {
      value: (input: SelectInput) => {
        prompts.push(input.message);
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
      const res = await menu({ cwd });
      const printed = Cli.stripAnsi(prints.join('\n'));
      const strippedOptions = harnessOptions.map((name) => Cli.stripAnsi(name));
      expect(res).to.eql({ kind: 'exit' });
      expect(printed).to.contain('pi:sandbox');
      expect(printed).to.match(/permissions\s+scoped/);
      expect(printed).to.match(/report\s+.*\.sandbox\.log\.md/);
      expect(printed).to.not.contain(`${cwd}/.log`);
      expect(printed).to.contain('.sandbox.log.md');
      expect(printed).to.match(/context\s+-/);
      expect(strippedOptions).to.include('  profile: reload');
      expect(strippedOptions).not.to.include('  config: reload');
      expect(strippedOptions).not.to.include('  reload');
      expect(prompts).to.eql(['agent:', 'agent:', 'agent:']);
    } finally {
      Object.defineProperty(Cli.Input.Select, 'prompt', { value: original });
      console.info = prevInfo;
      await Fs.remove(cwd);
    }
  });

  it('menu → lists loaded standard context files in the sandbox sheet', async () => {
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
      const res = await menu({ cwd });
      const printed = Cli.stripAnsi(prints.join('\n'));
      expect(res).to.eql({ kind: 'exit' });
      expect(printed).to.match(/context\s+\.\/AGENTS\.md, \.\/SYSTEM\.md/);
    } finally {
      Object.defineProperty(Cli.Input.Select, 'prompt', { value: original });
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
      const res = await menu({ cwd, allowAll: true });
      const printed = Cli.stripAnsi(prints.join('\n'));
      expect(res).to.eql({ kind: 'exit' });
      expect(printed).to.match(/permissions\s+allow-all/);
      expect(printed).to.match(/read\s+all/);
      expect(printed).to.match(/write\s+all/);
      const strippedOptions = harnessOptions.map((name) => Cli.stripAnsi(name));
      expect(strippedOptions).to.include('  start (--allow-all)');
      expect(strippedOptions).to.include('  profile: reload');
      expect(strippedOptions).not.to.include('  config: reload');
      expect(strippedOptions).not.to.include('  reload');
      expect(strippedOptions.indexOf('  profile: reload')).to.be.lessThan(
        strippedOptions.indexOf('  profile: rename'),
      );
    } finally {
      Object.defineProperty(Cli.Input.Select, 'prompt', { value: original });
      console.info = prevInfo;
      await Fs.remove(cwd);
    }
  });
});

type SelectInput = {
  readonly message: string;
  readonly options?: readonly { readonly name: string; readonly value: string }[];
};

function isRootMenu(input: SelectInput) {
  return (input.options ?? []).some((item) => item.value === 'exit');
}

function isActionMenu(input: SelectInput) {
  return (input.options ?? []).some((item) => item.value === 'back');
}
