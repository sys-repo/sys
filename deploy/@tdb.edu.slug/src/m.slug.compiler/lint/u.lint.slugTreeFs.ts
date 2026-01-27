import { type t, c, Cli, Fs } from './common.ts';

const DIR_NAME = '-slug.lint';
const EXT = '.yaml';
const DEFAULT_NAME = 'default.yaml';
const DEFAULT_YAML = '# slug lint profile\n';
const ADD_VALUE = '__add__';
const NAME_REGEX = /^[a-z0-9][a-z0-9._-]*$/i;

export async function selectSlugLintProfile(
  cwd: t.StringDir,
  opts: { interactive?: boolean } = {},
): Promise<t.StringFile | undefined> {
  const dir = Fs.join(cwd, DIR_NAME);
  await Fs.ensureDir(dir);

  let files = await listYaml(dir);
  if (files.length === 0) {
    const path = Fs.join(dir, DEFAULT_NAME);
    await Fs.write(path, DEFAULT_YAML);
    files = await listYaml(dir);
  }

  if (!opts.interactive) {
    return files[0];
  }

  while (true) {
    const options = [
      { name: '  add: <profile>', value: ADD_VALUE },
      ...withTree(files).map((item) => ({
        name: ` lint: ${item.tree} ${c.cyan(item.label)}`,
        value: item.path,
      })),
      { name: c.gray(c.dim('(exit)')), value: 'exit' },
    ];

    const picked = await Cli.Input.Select.prompt<string>({
      message: 'Lint profiles:\n',
      options,
      default: files[0],
      hideDefault: true,
    });

    if (picked === 'exit') return;
    if (picked !== ADD_VALUE) return picked as t.StringFile;

    const name = await Cli.Input.Text.prompt({
      message: 'Profile name',
      hint: 'letters, numbers, ".", "_" or "-" (e.g. slc.prog.index)',
      validate(value) {
        const trimmed = String(value ?? '').trim();
        if (!trimmed) return 'Name required.';
        if (!NAME_REGEX.test(trimmed)) return 'Invalid name.';
        const filename = fileOf(trimmed);
        if (files.some((p) => Fs.basename(p) === filename)) return 'Name already exists.';
        return true;
      },
    });

    const filename = fileOf(name.trim());
    const path = Fs.join(dir, filename);
    await Fs.write(path, DEFAULT_YAML);
    files = await listYaml(dir);
  }
}

function withTree(paths: readonly string[]) {
  return paths.map((path, i) => {
    const last = i === paths.length - 1;
    return {
      path,
      label: stripExt(Fs.basename(path)),
      tree: c.gray(last ? '└─' : '├─'),
    };
  });
}

async function listYaml(dir: t.StringDir): Promise<t.StringFile[]> {
  const paths: t.StringFile[] = [];
  for await (const entry of Deno.readDir(dir)) {
    if (!entry.isFile) continue;
    if (!entry.name.endsWith(EXT)) continue;
    paths.push(Fs.join(dir, entry.name));
  }
  return paths;
}

function stripExt(name: string): string {
  return name.endsWith(EXT) ? name.slice(0, -EXT.length) : name;
}

function fileOf(name: string): string {
  let base = name.trim();
  if (base.endsWith(EXT)) base = base.slice(0, -EXT.length);
  return `${base}${EXT}`;
}
