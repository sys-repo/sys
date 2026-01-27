import { type t, c, Cli, Fs, Open } from './common.ts';
import {
  ensureDefaultProfile,
  ensureProfileDir,
  listProfiles,
  profileFileOf,
  profileLabel,
} from './u.lint.slugTreeFs.ts';

const ADD_VALUE = '__add__';
const BACK_VALUE = 'back';
const DELETE_VALUE = 'delete';
const EDIT_VALUE = 'edit';
const FACETS_VALUE = 'facets';
const NAME_REGEX = /^[a-z0-9][a-z0-9._-]*$/i;
const RENAME_VALUE = 'rename';
const RUN_VALUE = 'run';

type Action = 'back' | 'delete' | 'edit' | 'facets' | 'rename' | 'run';

export type SlugLintProfilePick =
  | { kind: 'exit' }
  | { kind: 'back'; profile?: t.StringFile }
  | { kind: 'run'; profile: t.StringFile }
  | { kind: 'facets'; profile: t.StringFile };

export async function selectSlugLintProfile(
  cwd: t.StringDir,
  opts: { interactive?: boolean; defaultProfile?: t.StringFile } = {},
): Promise<SlugLintProfilePick> {
  const dir = await ensureProfileDir(cwd);

  let files = await listProfiles(dir);
  if (files.length === 0) {
    await ensureDefaultProfile(dir);
    files = await listProfiles(dir);
  }

  if (!opts.interactive) return { kind: 'run', profile: files[0] };

  let lastSelected: t.StringFile | undefined = opts.defaultProfile;
  while (true) {
    const options = [
      { name: '  add: <profile>', value: ADD_VALUE },
      ...withTree(files).map((item) => ({
        name: ` lint: ${item.tree} ${c.cyan(item.label)}`,
        value: item.path,
      })),
      { name: c.gray(c.dim('(exit)')), value: 'exit' },
    ];

    const defaultValue =
      lastSelected && files.includes(lastSelected) ? lastSelected : files[0];

    const picked = await Cli.Input.Select.prompt<string>({
      message: 'Lint profiles:\n',
      options,
      default: defaultValue,
      hideDefault: true,
    });

    if (picked === 'exit') return { kind: 'exit' };
    if (picked !== ADD_VALUE) {
      const selected = picked as t.StringFile;
      lastSelected = selected;
      const res = await selectSlugLintProfileAction(cwd, selected);
      if (res.kind === 'back') {
        files = await listProfiles(dir);
        if (files.length === 0) {
          await ensureDefaultProfile(dir);
          files = await listProfiles(dir);
        }
        return { kind: 'back', profile: selected };
      }
      return res;
    }

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
    lastSelected = path;
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

export async function selectSlugLintProfileAction(
  cwd: t.StringDir,
  profile: t.StringFile,
  opts: { defaultAction?: Action } = {},
): Promise<SlugLintProfilePick> {
  let current = profile;
  let lastAction: Action | undefined = opts.defaultAction;
  while (true) {
    const action = await promptProfileAction({
      name: profileLabel(current),
      defaultValue: lastAction,
    });
    lastAction = action;
    const next = await handleProfileAction({ cwd, profile: current, action });
    if (next.kind === 'run') return { kind: 'run', profile: current };
    if (next.kind === 'facets') return { kind: 'facets', profile: current };
    if (next.kind === 'back') return { kind: 'back' };
    if (next.kind === 'stay') {
      if (next.profile) current = next.profile;
      continue;
    }
    if (next.kind === 'deleted') return { kind: 'back' };
    continue;
  }
}

async function promptProfileAction(args: {
  name: string;
  defaultValue?: Action;
}): Promise<Action> {
  const { name, defaultValue } = args;
  const answer = await Cli.Input.Select.prompt<Action>({
    message: 'Actions:',
    options: [
      { name: `  run ${c.cyan(name)}`, value: RUN_VALUE },
      { name: '  facets', value: FACETS_VALUE },
      { name: '  config: edit', value: EDIT_VALUE },
      { name: '  config: rename', value: RENAME_VALUE },
      { name: c.dim(c.gray(' (delete)')), value: DELETE_VALUE },
      { name: `${c.cyan('←')} back`, value: BACK_VALUE },
    ],
    default: defaultValue,
    hideDefault: true,
  });
  return answer as Action;
}

type ActionResult =
  | { kind: 'back' }
  | { kind: 'stay'; profile?: t.StringFile }
  | { kind: 'deleted' }
  | { kind: 'run' }
  | { kind: 'facets' };

async function handleProfileAction(args: {
  cwd: t.StringDir;
  profile: t.StringFile;
  action: Action;
}): Promise<ActionResult> {
  const { cwd, profile, action } = args;
  const dir = Fs.dirname(profile);
  const name = profileLabel(profile);

  if (action === BACK_VALUE) return { kind: 'back' };
  if (action === RUN_VALUE) return { kind: 'run' };
  if (action === FACETS_VALUE) return { kind: 'facets' };

  if (action === EDIT_VALUE) {
    const rel = Fs.Path.trimCwd(profile, { cwd, prefix: true });
    const openTarget = rel.length > 0 ? rel : profile;
    Open.invokeDetached(cwd, openTarget, { silent: true });
    return { kind: 'stay' };
  }

  if (action === RENAME_VALUE) {
    const raw = await Cli.Input.Text.prompt({
      message: 'Profile name',
      default: name,
      validate(value) {
        const trimmed = String(value ?? '').trim();
        if (!trimmed) return 'Name required.';
        if (!NAME_REGEX.test(trimmed)) return 'Invalid name.';
        const filename = profileFileOf(trimmed);
        return Fs.exists(Fs.join(dir, filename)).then((exists) =>
          exists && trimmed !== name ? 'Name already exists.' : true
        );
      },
    });

    const nextName = raw.trim();
    if (nextName === name) return { kind: 'stay' };

    const nextFile = Fs.join(dir, profileFileOf(nextName));
    await Fs.move(profile, nextFile);
    return { kind: 'stay', profile: nextFile };
  }

  if (action === DELETE_VALUE) {
    const yes = await Cli.Input.Confirm.prompt({
      message: `Delete ${c.cyan(name)}?`,
      default: false,
    });
    if (!yes) return { kind: 'stay' };
    await Fs.remove(profile);
    return { kind: 'deleted' };
  }

  return { kind: 'back' };
}
