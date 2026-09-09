import { describe, expect, Fs, it } from '../../-test.ts';
import { makeWorkspace, makeWorkspaceWithPkg } from '../../-tests/u.ts';
import { cli } from '../m.cli.ts';
import { parseArgs } from '../u.args.ts';
import { Prompt } from '../u.prompt.ts';

type PromptMutable = {
  selectTemplate: typeof Prompt.selectTemplate;
  directoryName: typeof Prompt.directoryName;
};

describe('m.tmpl/m.cli', () => {
  it('interactive fallback still works', async () => {
    const tmp = await Fs.makeTempDir({ prefix: 'tmpl.cli.interactive-' });
    const cwd = tmp.absolute;
    const target = Fs.join(cwd, 'src/m.Demo');
    await Fs.ensureDir(Fs.join(cwd, 'src'));
    await Fs.write(
      Fs.join(cwd, 'deno.json'),
      `{
  "name": "@test/demo"
}
`,
    );
    await Fs.write(Fs.join(cwd, 'src/types.ts'), `export type * from './placeholder/t.ts';\n`);

    const selectTemplate = Prompt.selectTemplate;
    const directoryName = Prompt.directoryName;
    const prompt = Prompt as unknown as PromptMutable;
    try {
      prompt.selectTemplate = async () => 'm.mod';
      prompt.directoryName = async () => target;
      await cli(cwd, parseArgs([]));
    } finally {
      prompt.selectTemplate = selectTemplate;
      prompt.directoryName = directoryName;
    }

    expect(await Fs.exists(Fs.join(target, 'mod.ts'))).to.eql(true);
    expect(await Fs.exists(Fs.join(cwd, 'src/types.ts'))).to.eql(true);
  });

  it('non-interactive pkg succeeds with explicit flags', async () => {
    const test = await makeWorkspace();
    const cwd = test.root;
    const relTarget = 'code/ns/agent-driven';
    const lines: string[] = [];
    const info = console.info;
    const args = parseArgs([
      'pkg',
      '--dir',
      relTarget,
      '--pkgName',
      '@my-scope/agent-driven',
      '--non-interactive',
    ]);

    const selectTemplate = Prompt.selectTemplate;
    const directoryName = Prompt.directoryName;
    const prompt = Prompt as unknown as PromptMutable;
    try {
      console.info = (...args: unknown[]) => lines.push(args.map(String).join(' '));
      prompt.selectTemplate = async () => {
        throw new Error('should not prompt for template in --non-interactive mode');
      };
      prompt.directoryName = async () => {
        throw new Error('should not prompt for directory in --non-interactive mode');
      };
      await cli(cwd, args);
    } finally {
      console.info = info;
      prompt.selectTemplate = selectTemplate;
      prompt.directoryName = directoryName;
    }

    const denoJson = Fs.join(cwd, relTarget, 'deno.json');
    expect(await Fs.exists(denoJson)).to.eql(true);
    const output = lines.join('\n');
    expect(output.includes('commit msg:')).to.eql(true);
    expect(
      output.includes('chore(tmpl:pkg): scaffold code/ns/agent-driven for @my-scope/agent-driven'),
    ).to.eql(true);
  });

  it('non-interactive pkg.help targets an existing package without force', async () => {
    const test = await makeWorkspaceWithPkg('ns', 'helped', '@my-scope/helped');
    const lines: string[] = [];
    const info = console.info;

    try {
      console.info = (...args: unknown[]) => lines.push(args.map(String).join(' '));
      await cli(
        test.root,
        parseArgs(['pkg.help', '--dir', 'code/ns/helped', '--non-interactive']),
      );
    } finally {
      console.info = info;
    }

    expect(await Fs.exists(Fs.join(test.pkgDir, 'src/m.help/mod.ts'))).to.eql(true);
    const output = lines.join('\n');
    expect(output.includes('commit msg:')).to.eql(true);
    expect(output.includes('docs(tmpl:pkg.help): add help resources to code/ns/helped')).to.eql(true);
  });

  it('non-interactive pkg.help rejects template-specific name flags before writing', async () => {
    const test = await makeWorkspaceWithPkg('ns', 'helped', '@my-scope/helped');
    const message = await errorText(() =>
      cli(
        test.root,
        parseArgs([
          'pkg.help',
          '--dir',
          'code/ns/helped',
          '--pkgName',
          '@my-scope/helped',
          '--non-interactive',
        ]),
      )
    );

    expect(message).to.contain('Template "pkg.help" does not accept --pkgName.');
    expect(message).to.contain('hint: deno run -ERW jsr:@sys/tmpl dsl pkg.help');
    expect(await Fs.exists(Fs.join(test.pkgDir, 'src/m.help'))).to.eql(false);
  });

  it('non-interactive pkg.help preflights package shape before writing', async () => {
    const test = await makeWorkspace();
    const relTarget = 'code/ns/not-a-sys-pkg';
    const target = Fs.join(test.root, relTarget);
    await Fs.ensureDir(target);
    await Fs.writeJson(Fs.join(target, 'deno.json'), {
      name: '@my-scope/not-a-sys-pkg',
      version: '0.0.0',
    });

    const message = await errorText(() =>
      cli(test.root, parseArgs(['pkg.help', '--dir', relTarget, '--non-interactive']))
    );

    expect(message).to.contain('target must be an existing sys package root');
    expect(message).to.contain('runtime common surface');
    expect(message).to.contain('type surface');
    expect(await Fs.exists(Fs.join(target, 'src/m.help'))).to.eql(false);
  });

  it('non-interactive pkg.help requires --force before replacing an existing help spine', async () => {
    const test = await makeWorkspaceWithPkg('ns', 'helped', '@my-scope/helped');
    await cli(
      test.root,
      parseArgs(['pkg.help', '--dir', 'code/ns/helped', '--non-interactive']),
    );

    const message = await errorText(() =>
      cli(
        test.root,
        parseArgs(['pkg.help', '--dir', 'code/ns/helped', '--non-interactive']),
      )
    );

    expect(message).to.contain('help resources already exist');
    expect(message).to.contain('Use --force only after approving overwrite');
  });

  it('non-interactive fails when --dir missing', async () => {
    const test = await makeWorkspace();
    const message = await errorText(() =>
      cli(test.root, parseArgs(['pkg', '--pkgName', '@my-scope/foo', '--non-interactive']))
    );

    expect(message).to.contain('Missing required flag: --dir');
    expect(message).to.contain('hint: deno run -ERW jsr:@sys/tmpl dsl pkg');
  });

  it('non-interactive fails when required template params are missing', async () => {
    const test = await makeWorkspace();
    const pkgMessage = await errorText(() =>
      cli(test.root, parseArgs(['pkg', '--dir', 'code/ns/foo', '--non-interactive']))
    );

    expect(pkgMessage).to.contain('requires --pkgName');
    expect(pkgMessage).to.contain('hint: deno run -ERW jsr:@sys/tmpl dsl pkg');

    const uiMessage = await errorText(() =>
      cli(
        test.root,
        parseArgs(['m.mod.ui', '--dir', 'code/ns/foo/src/ui/Button', '--non-interactive']),
      )
    );

    expect(uiMessage).to.contain('requires --name');
    expect(uiMessage).to.contain('hint: deno run -ERW jsr:@sys/tmpl dsl m.mod.ui');
  });

  it('non-interactive repo dry-run does not execute setup side effects', async () => {
    const test = await makeWorkspace();
    const cwd = test.root;
    const relTarget = 'my-repo';
    const target = Fs.join(cwd, relTarget);

    await cli(
      cwd,
      parseArgs([
        'repo',
        '--dir',
        relTarget,
        '--non-interactive',
        '--dry-run',
      ]),
    );

    expect(await Fs.exists(target)).to.eql(false);
    expect(await Fs.exists(Fs.join(target, 'deps.yaml'))).to.eql(false);
    expect(await Fs.exists(Fs.join(target, 'deno.graph.json'))).to.eql(false);
  });

  it('interactive existing target warns and exits without failure', async () => {
    const test = await makeWorkspace();
    const cwd = test.root;
    const target = Fs.join(cwd, 'already-exists');
    await Fs.ensureDir(target);

    const selectTemplate = Prompt.selectTemplate;
    const directoryName = Prompt.directoryName;
    const prompt = Prompt as unknown as PromptMutable;
    try {
      prompt.selectTemplate = async () => 'm.mod';
      prompt.directoryName = async () => target;
      await cli(cwd, parseArgs([]));
    } finally {
      prompt.selectTemplate = selectTemplate;
      prompt.directoryName = directoryName;
    }

    expect(await Fs.exists(Fs.join(target, 'deno.json'))).to.eql(false);
  });

  it('non-interactive existing target with --force overwrites successfully', async () => {
    const test = await makeWorkspace();
    const cwd = test.root;
    const relTarget = 'code/ns/agent-driven';
    const target = Fs.join(cwd, relTarget);

    await Fs.ensureDir(target);
    await Fs.write(Fs.join(target, 'stale.txt'), 'stale');

    await cli(
      cwd,
      parseArgs([
        'pkg',
        '--dir',
        relTarget,
        '--pkgName',
        '@my-scope/agent-driven',
        '--force',
        '--non-interactive',
      ]),
    );

    expect(await Fs.exists(Fs.join(target, 'deno.json'))).to.eql(true);
    expect(await Fs.exists(Fs.join(target, 'src', 'mod.ts'))).to.eql(true);
  });
});

async function errorText(fn: () => Promise<unknown>): Promise<string> {
  try {
    await fn();
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }

  throw new Error('Expected function to throw.');
}
