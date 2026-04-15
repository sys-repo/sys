import { describe, expect, expectError, Fs, it } from '../../-test.ts';
import { makeWorkspace } from '../../-tests/u.ts';
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
    expect(output.includes('pkg scaffold created at code/ns/agent-driven for @my-scope/agent-driven (38 files)')).to.eql(true);
  });

  it('non-interactive fails when --dir missing', async () => {
    const test = await makeWorkspace();
    await expectError(
      () => cli(test.root, parseArgs(['pkg', '--pkgName', '@my-scope/foo', '--non-interactive'])),
      'Missing required flag: --dir',
    );
  });

  it('non-interactive fails when required template params are missing', async () => {
    const test = await makeWorkspace();
    await expectError(
      () => cli(test.root, parseArgs(['pkg', '--dir', 'code/ns/foo', '--non-interactive'])),
      'requires --pkgName',
    );

    await expectError(
      () => cli(test.root, parseArgs(['m.mod.ui', '--dir', 'code/ns/foo/src/ui/Button', '--non-interactive'])),
      'requires --name',
    );
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
