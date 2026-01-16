import { type t, c, Args, Cli, D, Fs, done } from './common.ts';
import { copyDenoFiles, copyFiles, copyGitChanged, copyTypes } from './u.cli.copy.ts';
import { Fmt } from './u.fmt.ts';

type C = t.ClipboardTool.Command;
type FilesSelectDepthResult = {
  readonly mode?: C;
  readonly depth?: number; // unspecified means "no depth filter"
};

export const cli: t.ClipboardToolsLib['cli'] = async (cwd, argv) => {
  const toolname = D.tool.name;
  cwd = cwd ?? Fs.cwd('terminal');
  const args = Args.parse<t.VideoTool.CliArgs>(argv, { alias: { h: 'help' } });
  if (args.help) return void console.info(await Fmt.help(toolname));

  console.info(await Fmt.header(toolname, cwd));
  await run(cwd);

  console.info();
  console.info(Fmt.signoff(toolname));
};

/**
 * Runtime:
 */
async function run(cwd: t.StringDir) {
  const depth0 = c.dim(c.italic(c.gray('← this folder only')));
  const mode = (await Cli.Input.Select.prompt<C>({
    message: 'Select copy mode:\n',
    options: [
      { name: `Copy Git working tree`, value: `git:changed` },
      {
        name: `Copy Files (select, ${c.cyan('depth = 0')}) ${depth0}`,
        value: `files:select:depth=` as C,
      },
      { name: `Copy Files`, value: `files:select` },
      { name: `Copy Files (all)`, value: `files:all` },
      { name: `Copy Types`, value: `types:select` },
      { name: `Copy Types (all)`, value: `types:all` },
      { name: `Copy deno.json`, value: `files:deno.json` },
    ],
  })) as t.ClipboardTool.Command;

  if (mode.startsWith('files:select' satisfies t.ClipboardTool.Command)) {
    const { depth } = wrangle.depth(mode);
    await copyFiles(cwd, { initial: 'none', depth });
    return done();
  }
  if (mode === 'files:all') {
    const { depth } = wrangle.depth(mode);
    await copyFiles(cwd, { initial: 'all', depth });
    return done();
  }
  if (mode === 'types:select') {
    await copyTypes(cwd, { initial: 'none' });
    return done();
  }
  if (mode === 'types:all') {
    await copyTypes(cwd, { initial: 'all' });
    return done();
  }
  if (mode === 'files:deno.json') {
    await copyDenoFiles(cwd, {});
    return done();
  }
  if (mode === 'git:changed') {
    await copyGitChanged(cwd);
    return done();
  }

  return { mode };
}

/**
 * Helpers:
 */
const wrangle = {
  depth(input: C): FilesSelectDepthResult {
    if (!input.startsWith('files:select')) return {};

    const i = input.indexOf(':depth=');
    if (i < 0) return { mode: 'files:select' }; // no depth specified

    const raw = input.slice(i + ':depth='.length);
    const n = Number(raw);

    return {
      mode: 'files:select',
      depth: Number.isFinite(n) ? n : undefined,
    };
  },
} as const;
