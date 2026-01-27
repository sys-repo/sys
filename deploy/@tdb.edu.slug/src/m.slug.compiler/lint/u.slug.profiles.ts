import { type t, c, Cli, Fs } from './common.ts';
import {
  ensureDefaultProfile,
  ensureProfileDir,
  listProfiles,
  profileFileOf,
  profileLabel,
} from './u.lint.slugTreeFs.ts';

const ADD_VALUE = '__add__';
const NAME_REGEX = /^[a-z0-9][a-z0-9._-]*$/i;

export async function selectSlugLintProfile(
  cwd: t.StringDir,
  opts: { interactive?: boolean } = {},
): Promise<t.StringFile | undefined> {
  const dir = await ensureProfileDir(cwd);

  let files = await listProfiles(dir);
  if (files.length === 0) {
    await ensureDefaultProfile(dir);
    files = await listProfiles(dir);
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
        const filename = profileFileOf(trimmed);
        if (files.some((p) => Fs.basename(p) === filename)) return 'Name already exists.';
        return true;
      },
    });

    const filename = profileFileOf(name.trim());
    const path = Fs.join(dir, filename);
    await Fs.write(path, '# slug lint profile\n');
    files = await listProfiles(dir);
  }
}

function withTree(paths: readonly string[]) {
  return paths.map((path, i) => {
    const last = i === paths.length - 1;
    return {
      path,
      label: profileLabel(path),
      tree: c.gray(last ? '└─' : '├─'),
    };
  });
}
