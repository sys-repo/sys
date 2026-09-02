import { describe, expect, it } from '../../../-test.ts';
import { Process as ProcessOwner } from '../../m.cli/common.ts';
import { Ocr } from '../../m.extension/m.ocr/mod.ts';
import { Fs, Path, Str, type t } from '../common.ts';
import { Profiles as ProfilesOwner } from '../mod.ts';
import { DEFAULT_SYSTEM_PROMPT, PROVENANCE_SAFETY_PROMPT } from '../u/u.prompt.ts';
import { resolveRun } from '../u/u.resolve.run.ts';
import { withInherit } from '../../m.cli/u.inherit.ts';
import { withInvoke } from '../../m.cli/u.invoke.ts';
import { PI_AGENT_IMPORT_BASE } from '../../m.cli/u.resolve.pkg.ts';

const Process = { ...ProcessOwner };
const Profiles = {
  ...ProfilesOwner,
  run: (input: Parameters<typeof ProfilesOwner.run>[0]) =>
    withInherit(Process.inherit, () => withInvoke(Process.invoke, () => ProfilesOwner.run(input))),
};

type RegisteredTool = {
  readonly name: string;
  execute(
    toolCallId: string,
    params: Record<string, unknown>,
    signal: AbortSignal | undefined,
    onUpdate: unknown,
    ctx: { readonly cwd: string },
  ): Promise<{ readonly isError?: boolean; readonly details?: unknown }>;
};

type GeneratedSandboxFsModule = {
  readonly default: (pi: { registerTool(tool: RegisteredTool): void }) => void;
};

describe(`@sys/driver-pi/cli/Profiles/m.run`, () => {
  it('run → merges typed profile sandbox policy and invocation args into raw Pi launch', async () => {
    const prev = Process.inherit;
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.m.run.test.' }))
      .absolute as t.StringDir;
    const config = `${cwd}/profiles.yaml` as t.StringPath;
    try {
      await Fs.write(
        config,
        Str.dedent(
          `
          prompt:
            system: You are the profile prompt.
          sandbox:
            capability:
              read: [./profile-read]
              write: [./profile-write]
              env:
                PI_PROFILE: work
                PI_KEEP: profile
            context:
              append: [./profile-context]
          `,
        ).trimStart(),
      );
      await Fs.write(Fs.join(cwd, 'profile-context'), 'Profile context text.');

      await Fs.ensureDir(`${cwd}/.git`);

      Process.inherit = async (input) => {
        const read = findArg(input.args, '--allow-read=');
        const write = findArg(input.args, '--allow-write=');
        expect(input.cwd).to.eql(cwd);
        expect(input.args).to.include('--no-prompt');
        expect(input.args).to.include('--no-context-files');
        const prompt = systemPrompt(input.args);
        expect(prompt).to.contain('You are the profile prompt.');
        expect(prompt).not.to.contain(PROVENANCE_SAFETY_PROMPT);
        expectFinalProvenanceSafety(input.args);
        expect(input.args).to.include.members(['--model', 'gpt-5.4', '--help']);
        const contextText = await readContextBundle(input.args);
        expect(contextText).to.contain('# Project Context');
        expect(contextText).to.contain(`${cwd}/profile-context`);
        expect(contextText).to.contain('Profile context text.');
        expect(read).to.contain(Fs.join(cwd, 'profile-read'));
        expect(read).not.to.contain(Fs.join(cwd, 'profile-context'));
        expect(read).to.contain('./extra-read');
        expect(write).to.contain(Fs.join(cwd, 'profile-write'));
        expect(write).to.contain('./extra-write');
        expect(input.env?.PI_PROFILE).to.eql('override');
        expect(input.env?.PI_KEEP).to.eql('profile');
        return { code: 0, success: true, signal: null };
      };

      const res = await Profiles.run({
        cwd: { invoked: cwd, git: cwd },
        config,
        args: ['--model', 'gpt-5.4', '--help'],
        read: ['./extra-read' as t.StringPath],
        write: ['./extra-write' as t.StringPath],
        env: { PI_PROFILE: 'override' },
      });

      expect(res.success).to.eql(true);
    } finally {
      Process.inherit = prev;
      await Fs.remove(cwd);
    }
  });

  it('resolveRun → binds tool truth to the package selected by workspace deps', async () => {
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.m.run.test.' }))
      .absolute as t.StringDir;
    const config = `${cwd}/profiles.yaml` as t.StringPath;
    const pkg = `${PI_AGENT_IMPORT_BASE}@0.83.0` as t.StringModuleSpecifier;
    try {
      await Fs.ensureDir(`${cwd}/.git`);
      await Fs.write(config, 'sandbox: {}\n');
      await Fs.write(`${cwd}/deps.yaml`, `deno.json:\n  - import: ${pkg}\n`);

      const resolved = await resolveRun({
        cwd: { invoked: cwd, git: cwd },
        config,
        args: ['--tools', 'powershell'],
      }, { extensions: false, ocrPreflight: false });

      expect(resolved.pkg).to.eql(pkg);
      expect(resolved.tools).to.eql(undefined);
    } finally {
      await Fs.remove(cwd);
    }
  });

  it('run → materializes enabled sandbox filesystem extension with truthful prompt contracts', async () => {
    const prev = Process.inherit;
    const prevTmpDir = Deno.env.get('TMPDIR');
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.m.run.test.' }))
      .absolute as t.StringDir;
    const tmpDir = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.clipboard.' }))
      .absolute as t.StringDir;
    const config = `${cwd}/profiles.yaml` as t.StringPath;
    try {
      Deno.env.set('TMPDIR', `${tmpDir}/`);
      await Fs.write(
        config,
        Str.dedent(
          `
          sandbox:
            capability:
              write: [./allowed]
          tools:
            remove:
              enabled: true
              recursive: false
            move:
              enabled: true
            copy:
              enabled: true
          `,
        ).trimStart(),
      );
      await Fs.ensureDir(`${cwd}/.git`);

      Process.inherit = async (input) => {
        const extensionIndex = input.args.indexOf('--extension');
        expect(extensionIndex).to.be.greaterThan(-1);
        const extensionPath = input.args[extensionIndex + 1] as t.StringPath;
        expect(extensionPath).to.eql(
          Fs.join(cwd, '.pi', '@sys', 'extensions', 'sandbox.fs', 'mod.ts'),
        );
        expect(input.args).to.include('--no-extensions');

        const prompt = appendSystemPrompts(input.args).join('\n');
        expect(prompt).to.contain('Runtime Tool Contract: remove');
        expect(prompt).to.contain('Runtime Tool Contract: move');
        expect(prompt).to.contain('Runtime Tool Contract: copy');
        expect(prompt).to.contain('Bash is not a file deletion or cleanup fallback.');
        expect(prompt).to.contain('Bash is not a file move/rename fallback.');
        expect(prompt).to.contain('Bash is not a file copy fallback.');
        expect(prompt).to.contain('Do not use `bash`, `rm`, `rmdir`, `unlink`');
        expect(prompt).to.contain(
          'If asked to delete and the callable `remove` tool is unavailable',
        );
        expect(prompt).to.contain('Do not fall back to `bash`.');
        expect(prompt).to.contain('Recursive removal is disabled');
        expectFinalProvenanceSafety(input.args);

        const read = await Fs.readText(extensionPath);
        if (!read.ok) throw read.error;
        const text = read.data ?? '';
        const dir = Fs.dirname(extensionPath);
        const tool = await Fs.readText(Fs.join(dir, 'u.tool.ts'));
        if (!tool.ok) throw tool.error;
        const toolText = tool.data ?? '';
        expect(toolText).to.contain("name: 'remove'");
        expect(toolText).to.contain("name: 'move'");
        expect(toolText).to.contain("name: 'copy'");
        expect(text).to.contain(tmpDir);
        expect(text).not.to.contain(`${tmpDir}/`);
        expect(countOccurrences(text, tmpDir)).to.eql(1);
        expect(text).to.contain(`${cwd}/allowed`);
        expect(text).to.contain(`${cwd}/.git`);
        expect(text).to.contain(`${cwd}/.pi`);
        expect(text).not.to.contain(`${cwd}/.pi/@sys/tmp`);

        const clipboard = Fs.join(tmpDir, 'pi-clipboard-test.png') as t.StringPath;
        const imported = Fs.join(cwd, 'clipboard.png') as t.StringPath;
        await Fs.write(clipboard, 'png bytes');

        const mod = await importGenerated(extensionPath);
        const tools: RegisteredTool[] = [];
        mod.default({ registerTool: (tool) => tools.push(tool) });
        const copied = await findTool(tools, 'copy').execute(
          'copy-1',
          { from: clipboard, to: 'clipboard.png' },
          undefined,
          undefined,
          { cwd },
        );
        expect(copied.isError).to.eql(undefined);
        expect((await Fs.readText(imported)).data).to.eql('png bytes');

        return { code: 0, success: true, signal: null };
      };

      const res = await Profiles.run({ cwd: { invoked: cwd, git: cwd }, config });
      expect(res.success).to.eql(true);
    } finally {
      Process.inherit = prev;
      if (prevTmpDir === undefined) Deno.env.delete('TMPDIR');
      else Deno.env.set('TMPDIR', prevTmpDir);
      await Fs.remove(cwd);
      await Fs.remove(tmpDir);
    }
  });

  it('resolveRun → can skip OCR preflight for OCR-setup-free sandbox previews', async () => {
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.m.run.test.' }))
      .absolute as t.StringDir;
    const config = `${cwd}/profiles.yaml` as t.StringPath;
    try {
      await Fs.write(
        config,
        Str.dedent(
          `
          tools:
            remove:
              enabled: false
            move:
              enabled: false
            copy:
              enabled: false
            ocr:
              pdf:
                enabled: true
          `,
        ).trimStart(),
      );
      await Fs.ensureDir(`${cwd}/.git`);

      const resolved = await resolveRun({
        cwd: { invoked: cwd, git: cwd },
        config,
        ocr: { preflight: false },
      });

      expect(resolved.args).not.to.include('--extension');
    } finally {
      await Fs.remove(cwd);
    }
  });

  it('run → materializes enabled OCR PDF extension after startup preflight', async () => {
    const prevInherit = Process.inherit;
    const prevInvoke = Process.invoke;
    const prevDependencies = Ocr.Resolve.dependencies;
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.m.run.test.' }))
      .absolute as t.StringDir;
    const config = `${cwd}/profiles.yaml` as t.StringPath;
    const executables: t.PiOcrExtension.Dependency.Executables = {
      pdfinfo: '/ocr/bin/pdfinfo' as t.StringPath,
      pdftoppm: '/ocr/bin/pdftoppm' as t.StringPath,
      tesseract: '/ocr/bin/tesseract' as t.StringPath,
    };
    try {
      await Fs.write(
        config,
        Str.dedent(
          `
          sandbox:
            capability:
              read: [./pdfs]
          tools:
            remove:
              enabled: false
            move:
              enabled: false
            copy:
              enabled: false
            ocr:
              pdf:
                enabled: true
                languages: [eng, deu]
                defaultLanguage: deu
          `,
        ).trimStart(),
      );
      await Fs.ensureDir(`${cwd}/.git`);

      let dependencyProbeCount = 0;
      (Ocr.Resolve as { dependencies: typeof prevDependencies }).dependencies = async () => {
        dependencyProbeCount += 1;
        return { ok: true, executables, installCommand: Ocr.installCommand() };
      };
      (Process as typeof Process & { invoke: typeof prevInvoke }).invoke = async (input) => {
        expect(input.cmd).to.eql('/ocr/bin/tesseract');
        expect(input.args).to.eql(['--list-langs']);
        const stdout = 'List of available languages in "/ocr/tessdata" (2):\neng\ndeu\n';
        return {
          code: 0,
          success: true,
          signal: null,
          stdout: new TextEncoder().encode(stdout),
          stderr: new Uint8Array(),
          text: { stdout, stderr: '' },
          toString: () => stdout,
        };
      };
      Process.inherit = async (input) => {
        const extensionIndex = input.args.indexOf('--extension');
        expect(extensionIndex).to.be.greaterThan(-1);
        const extensionPath = input.args[extensionIndex + 1] as t.StringPath;
        expect(extensionPath).to.eql(Fs.join(cwd, '.pi', '@sys', 'extensions', 'ocr', 'mod.ts'));
        expect(input.args.filter((arg) => arg === '--extension').length).to.eql(1);
        expect(input.args).to.include('--no-extensions');

        const prompt = appendSystemPrompts(input.args).join('\n');
        expect(prompt).to.contain('Runtime Tool Contract: ocr_pdf');
        expect(prompt).to.contain('Bash is not an OCR fallback.');
        expect(prompt).to.contain('default language deu');
        expect(prompt).not.to.contain('Runtime Tool Contract: remove');
        expect(prompt).not.to.contain('Runtime Tool Contract: copy');
        expectFinalProvenanceSafety(input.args);

        const read = await Fs.readText(extensionPath);
        if (!read.ok) throw read.error;
        const text = read.data ?? '';
        expect(text).to.contain("name: 'ocr_pdf'");
        expect(text).to.contain('"pdfinfo": "/ocr/bin/pdfinfo"');
        expect(text).to.contain('"pdftoppm": "/ocr/bin/pdftoppm"');
        expect(text).to.contain('"tesseract": "/ocr/bin/tesseract"');
        expect(text).to.contain(`"tmpRoot": "${cwd}/.pi/@sys/tmp/ocr"`);
        expect(text).to.contain(`${cwd}/pdfs`);
        expect(text).to.contain('"defaultLanguage": "deu"');
        expect(text).not.to.contain('__OCR_POLICY__');
        return { code: 0, success: true, signal: null };
      };

      const res = await Profiles.run({ cwd: { invoked: cwd, git: cwd }, config });
      expect(res.success).to.eql(true);
      expect(dependencyProbeCount).to.eql(1);
    } finally {
      Process.inherit = prevInherit;
      (Process as typeof Process & { invoke: typeof prevInvoke }).invoke = prevInvoke;
      (Ocr.Resolve as { dependencies: typeof prevDependencies }).dependencies = prevDependencies;
      await Fs.remove(cwd);
    }
  });

  it('run → leaves sandbox filesystem extension disabled when profile explicitly opts out', async () => {
    const prev = Process.inherit;
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.m.run.test.' }))
      .absolute as t.StringDir;
    const config = `${cwd}/profiles.yaml` as t.StringPath;
    try {
      await Fs.write(
        config,
        Str.dedent(
          `
          tools:
            remove:
              enabled: false
              recursive: true
            move:
              enabled: false
            copy:
              enabled: false
          `,
        ).trimStart(),
      );
      await Fs.ensureDir(`${cwd}/.git`);

      Process.inherit = async (input) => {
        expect(input.args).not.to.include('--extension');
        const prompt = appendSystemPrompts(input.args).join('\n');
        expect(prompt).not.to.contain('Runtime Tool Contract: remove');
        expect(prompt).not.to.contain('Runtime Tool Contract: move');
        expect(prompt).not.to.contain('Runtime Tool Contract: copy');
        const exists = await Fs.exists(Fs.join(cwd, '.pi', '@sys', 'extensions', 'sandbox.fs'));
        expect(exists).to.eql(false);
        return { code: 0, success: true, signal: null };
      };

      const res = await Profiles.run({ cwd: { invoked: cwd, git: cwd }, config });
      expect(res.success).to.eql(true);
    } finally {
      Process.inherit = prev;
      await Fs.remove(cwd);
    }
  });

  it('run → migrates generated legacy context.include before validation', async () => {
    const prev = Process.inherit;
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.m.run.test.' }))
      .absolute as t.StringDir;
    const config = `${cwd}/profiles.yaml` as t.StringPath;
    try {
      await Fs.write(config, 'sandbox:\n  context:\n    include: []\n');
      await Fs.ensureDir(`${cwd}/.git`);

      Process.inherit = async () => {
        return { code: 0, success: true, signal: null };
      };

      const res = await Profiles.run({ cwd: { invoked: cwd, git: cwd }, config });
      expect(res.success).to.eql(true);
      const text = (await Fs.readText(config)).data ?? '';
      expect(text).to.contain('append: []');
      expect(text).not.to.contain('include:');
    } finally {
      Process.inherit = prev;
      await Fs.remove(cwd);
    }
  });

  it('run → injects launcher-owned active profile runtime metadata', async () => {
    const prev = Process.inherit;
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.m.run.test.' }))
      .absolute as t.StringDir;
    const config = './profiles.yaml' as t.StringPath;
    const absoluteConfig = Fs.join(cwd, 'profiles.yaml') as t.StringPath;
    try {
      await Fs.write(absoluteConfig, 'sandbox: {}\n');
      await Fs.ensureDir(`${cwd}/.git`);

      Process.inherit = async (input) => {
        expect(input.cwd).to.eql(cwd);
        expectRuntimeMetadata(input.args, { cwd, profile: absoluteConfig });
        expectFinalProvenanceSafety(input.args);
        return { code: 0, success: true, signal: null };
      };

      const res = await Profiles.run({ cwd: { invoked: cwd, git: cwd }, config });
      expect(res.success).to.eql(true);
    } finally {
      Process.inherit = prev;
      await Fs.remove(cwd);
    }
  });

  it('run → loads standard AGENTS and SYSTEM files when present', async () => {
    const prev = Process.inherit;
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.m.run.test.' }))
      .absolute as t.StringDir;
    const config = `${cwd}/profiles.yaml` as t.StringPath;
    try {
      await Fs.write(config, 'sandbox:\n  context:\n    append: []\n');
      await Fs.write(Fs.join(cwd, 'AGENTS.md'), 'Agent guidance.');
      await Fs.write(Fs.join(cwd, 'SYSTEM.md'), 'System guidance.');
      await Fs.ensureDir(`${cwd}/.git`);

      Process.inherit = async (input) => {
        const prompt = systemPrompt(input.args);
        expect(prompt).to.contain('You are an expert coding assistant.');
        expect(prompt).to.contain('# Local System Instructions');
        expect(prompt).to.contain(`${cwd}/SYSTEM.md`);
        expect(prompt).to.contain('System guidance.');
        expect(prompt).not.to.contain(PROVENANCE_SAFETY_PROMPT);
        expectFinalProvenanceSafety(input.args);

        const contextText = await readContextBundle(input.args);
        expect(contextText).to.contain(`${cwd}/AGENTS.md`);
        expect(contextText).to.contain('Agent guidance.');
        expect(contextText).not.to.contain('SYSTEM.md');
        return { code: 0, success: true, signal: null };
      };

      const res = await Profiles.run({ cwd: { invoked: cwd, git: cwd }, config });
      expect(res.success).to.eql(true);
    } finally {
      Process.inherit = prev;
      await Fs.remove(cwd);
    }
  });

  it('run → appends profile context after standard AGENTS context', async () => {
    const prev = Process.inherit;
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.m.run.test.' }))
      .absolute as t.StringDir;
    const config = `${cwd}/profiles.yaml` as t.StringPath;
    try {
      await Fs.write(
        config,
        Str.dedent(
          `
          sandbox:
            context:
              append: [./profile-context]
          `,
        ).trimStart(),
      );
      await Fs.write(Fs.join(cwd, 'AGENTS.md'), 'Agent guidance.');
      await Fs.write(Fs.join(cwd, 'profile-context'), 'Profile context text.');
      await Fs.ensureDir(`${cwd}/.git`);

      Process.inherit = async (input) => {
        const text = await readContextBundle(input.args);
        expect(text.indexOf(`${cwd}/AGENTS.md`)).to.be.lessThan(
          text.indexOf(`${cwd}/profile-context`),
        );
        expect(text).to.contain('Agent guidance.');
        expect(text).to.contain('Profile context text.');
        return { code: 0, success: true, signal: null };
      };

      const res = await Profiles.run({ cwd: { invoked: cwd, git: cwd }, config });
      expect(res.success).to.eql(true);
    } finally {
      Process.inherit = prev;
      await Fs.remove(cwd);
    }
  });

  it('run → uses an explicit multiline profile system prompt from YAML', async () => {
    const prev = Process.inherit;
    const prompt = 'You are the profile prompt.\nStay concise.';
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.m.run.test.' }))
      .absolute as t.StringDir;
    const config = `${cwd}/profiles.yaml` as t.StringPath;
    try {
      await Fs.write(
        config,
        Str.dedent(
          `
          prompt:
            system: |-
              You are the profile prompt.
              Stay concise.
          `,
        ).trimStart(),
      );

      await Fs.ensureDir(`${cwd}/.git`);

      Process.inherit = async (input) => {
        const value = systemPrompt(input.args);
        expect(value).to.contain(prompt);
        expect(value).not.to.contain(PROVENANCE_SAFETY_PROMPT);
        expectFinalProvenanceSafety(input.args);
        return { code: 0, success: true, signal: null };
      };

      const res = await Profiles.run({
        cwd: { invoked: cwd, git: cwd },
        config,
      });
      expect(res.success).to.eql(true);
    } finally {
      Process.inherit = prev;
      await Fs.remove(cwd);
    }
  });

  it('run → does not append SYSTEM to an explicit profile system prompt', async () => {
    const prev = Process.inherit;
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.m.run.test.' }))
      .absolute as t.StringDir;
    const config = `${cwd}/profiles.yaml` as t.StringPath;
    try {
      await Fs.write(config, 'prompt:\n  system: Custom prompt.\n');
      await Fs.write(Fs.join(cwd, 'SYSTEM.md'), 'System guidance.');
      await Fs.ensureDir(`${cwd}/.git`);

      Process.inherit = async (input) => {
        const prompt = systemPrompt(input.args);
        expect(prompt).to.contain('Custom prompt.');
        expect(prompt).not.to.contain(PROVENANCE_SAFETY_PROMPT);
        expect(prompt).not.to.contain('System guidance.');
        expectFinalProvenanceSafety(input.args);
        expectRuntimeMetadata(input.args, { cwd, profile: config });
        return { code: 0, success: true, signal: null };
      };

      const res = await Profiles.run({ cwd: { invoked: cwd, git: cwd }, config });
      expect(res.success).to.eql(true);
    } finally {
      Process.inherit = prev;
      await Fs.remove(cwd);
    }
  });

  it('run → uses the selected profile file with the wrapper-owned default prompt', async () => {
    const prev = Process.inherit;
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.m.run.test.' }))
      .absolute as t.StringDir;
    const config = `${cwd}/profiles.yaml` as t.StringPath;
    try {
      await Fs.write(
        config,
        Str.dedent(
          `
          sandbox:
            capability:
              env:
                PI_PROFILE: main
          `,
        ).trimStart(),
      );

      await Fs.ensureDir(`${cwd}/.git`);

      Process.inherit = async (input) => {
        expect(input.args).to.include('--no-prompt');
        expect(systemPrompt(input.args)).to.eql(defaultSystemPromptBody());
        expectFinalProvenanceSafety(input.args);
        expect(input.args).to.include.members(['--model', 'gpt-5.4']);
        expect(input.env?.PI_PROFILE).to.eql('main');
        return { code: 0, success: true, signal: null };
      };

      const res = await Profiles.run({
        cwd: { invoked: cwd, git: cwd },
        config,
        args: ['--model', 'gpt-5.4'],
      });
      expect(res.success).to.eql(true);
    } finally {
      Process.inherit = prev;
      await Fs.remove(cwd);
    }
  });

  it('run → uses default prompt body and final safety when profile prompt is absent', async () => {
    const prev = Process.inherit;
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.m.run.test.' }))
      .absolute as t.StringDir;
    const config = `${cwd}/profiles.yaml` as t.StringPath;
    try {
      await Fs.write(
        config,
        Str.dedent(
          `
          sandbox:
            capability:
              env:
                PI_PROFILE: main
          `,
        ).trimStart(),
      );

      await Fs.ensureDir(`${cwd}/.git`);

      Process.inherit = async (input) => {
        const prompt = systemPrompt(input.args);
        expect(prompt).to.eql(defaultSystemPromptBody());
        expect(prompt).to.contain('deno run -ER jsr:@sys/driver-pi dsl');
        expect(prompt).to.contain('DSL guidance does not prove a tool is callable');
        expect(prompt).not.to.contain('Runtime Tool Contract: ocr_pdf');
        expectFinalProvenanceSafety(input.args);
        expect(input.env?.PI_PROFILE).to.eql('main');
        return { code: 0, success: true, signal: null };
      };

      const res = await Profiles.run({
        cwd: { invoked: cwd, git: cwd },
        config,
        args: ['--help'],
      });
      expect(res.success).to.eql(true);
    } finally {
      Process.inherit = prev;
      await Fs.remove(cwd);
    }
  });

  it('run → uses default prompt body and final safety when profile prompt is null', async () => {
    const prev = Process.inherit;
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.m.run.test.' }))
      .absolute as t.StringDir;
    const config = `${cwd}/profiles.yaml` as t.StringPath;
    try {
      await Fs.write(
        config,
        Str.dedent(
          `
          prompt:
            system: null
          `,
        ).trimStart(),
      );

      await Fs.ensureDir(`${cwd}/.git`);

      Process.inherit = async (input) => {
        expect(systemPrompt(input.args)).to.eql(defaultSystemPromptBody());
        expectFinalProvenanceSafety(input.args);
        return { code: 0, success: true, signal: null };
      };

      const res = await Profiles.run({
        cwd: { invoked: cwd, git: cwd },
        config,
      });
      expect(res.success).to.eql(true);
    } finally {
      Process.inherit = prev;
      await Fs.remove(cwd);
    }
  });

  it('run → rejects invocation-time prompt-surface passthrough', async () => {
    const prev = Process.inherit;
    const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.profiles.m.run.test.' }))
      .absolute as t.StringDir;
    const config = `${cwd}/profiles.yaml` as t.StringPath;
    try {
      await Fs.write(
        config,
        Str.dedent(
          `
          prompt:
            system: profile prompt
          `,
        ).trimStart(),
      );
      await Fs.ensureDir(`${cwd}/.git`);

      Process.inherit = async () => {
        throw new Error('Process.inherit should not run after prompt passthrough rejection.');
      };

      let error: unknown;
      try {
        await Profiles.run({
          cwd: { invoked: cwd, git: cwd },
          config,
          args: ['--system-prompt', 'runtime prompt'],
        });
      } catch (err) {
        error = err;
      }

      expect(error).to.be.instanceOf(Error);
      if (error instanceof Error) {
        expect(error.message).to.contain(
          'Profile mode owns Pi prompt, context, skill, and extension startup surfaces; passthrough is not allowed: --system-prompt',
        );
      }
    } finally {
      Process.inherit = prev;
      await Fs.remove(cwd);
    }
  });
});

/**
 * Helpers:
 */

function expectRuntimeMetadata(
  args: readonly string[],
  expected: { cwd: t.StringDir; profile: t.StringPath },
) {
  const matches = appendSystemPrompts(args).filter((value) => value.includes('# Runtime Metadata'));
  expect(matches.length).to.eql(1);
  const [value] = matches;
  expect(value).to.contain('Trusted launcher-provided metadata');
  expect(value).to.contain('runtime:');
  expect(value).to.contain(`  cwd: ${expected.cwd}`);
  expect(value).to.contain('  pi:');
  expect(value).to.contain(`    active-profile: ${expected.profile}`);
  expect(value).to.contain('    sandbox-paths-resolve-from: runtime-root');
}

async function readContextBundle(args: readonly string[]) {
  const path = appendSystemPrompts(args).find((value) => !value.includes('# Runtime Metadata'));
  expect(path).to.be.a('string');
  const read = await Fs.readText(path as t.StringPath);
  if (!read.ok) throw read.error;
  return read.data ?? '';
}

function appendSystemPrompts(args: readonly string[]) {
  return args.flatMap((arg, index) =>
    arg === '--append-system-prompt' ? [args[index + 1] ?? ''] : []
  );
}

function systemPrompt(args: readonly string[]) {
  const index = args.indexOf('--system-prompt');
  expect(index).to.be.greaterThan(-1);
  return args[index + 1] ?? '';
}

function expectFinalProvenanceSafety(args: readonly string[]) {
  const appended = appendSystemPrompts(args);
  expect(appended[appended.length - 1]).to.eql(PROVENANCE_SAFETY_PROMPT);
}

function defaultSystemPromptBody() {
  return DEFAULT_SYSTEM_PROMPT.replace(`\n\n${PROVENANCE_SAFETY_PROMPT}`, '');
}

function countOccurrences(text: string, value: string) {
  if (!value) return 0;
  return text.split(value).length - 1;
}

async function importGenerated(path: t.StringPath): Promise<GeneratedSandboxFsModule> {
  const url = Path.toFileUrl(path);
  url.search = `v=${Date.now()}.${Math.random()}`;
  return await import(url.href) as GeneratedSandboxFsModule;
}

function findTool(tools: readonly RegisteredTool[], name: string) {
  const tool = tools.find((item) => item.name === name);
  if (!tool) throw new Error(`Missing generated sandbox filesystem tool: ${name}`);
  return tool;
}

function findArg(args: readonly string[], prefix: string) {
  const value = args.find((arg) => arg.startsWith(prefix));
  expect(value).to.be.a('string');
  return value as string;
}
