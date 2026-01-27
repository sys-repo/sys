import { type t, DEFAULT, c, Cli, Fmt, Fs, Open } from './common.ts';
import {
  ensureConfigDir,
  ensureDefaultConfig,
  fileLabel,
  fileOf,
  listConfigs,
  validateYaml,
  writeYaml,
} from './u.fs.ts';
import type {
  YamlConfigMenuActionBase,
  YamlConfigMenuArgs,
  YamlConfigMenuResult,
} from './t.menu.ts';

const NAME_REGEX = /^[a-z0-9][a-z0-9._-]*$/i;
const ADD_VALUE = '__add__';

export async function menu<T, A extends string = string>(
  args: YamlConfigMenuArgs<T, A>,
): Promise<YamlConfigMenuResult<A>> {
  const ext = args.ext ?? DEFAULT.EXT;
  const dir = await ensureConfigDir(args.cwd, args.dir);

  let files = await listConfigs(dir, ext);
  if (files.length === 0) {
    await ensureDefaultConfig(dir, args.schema, DEFAULT.NAME, ext);
    files = await listConfigs(dir, ext);
  }

  let lastSelected: t.StringFile | undefined;
  while (true) {
    const options = [
      { name: args.addLabel ?? '  add: <config>', value: ADD_VALUE },
      ...withTree(files, ext).map((item) => ({
        name: ` ${args.itemLabel ?? 'config'}: ${item.tree} ${c.cyan(item.label)}`,
        value: item.path,
      })),
      { name: c.gray(c.dim(args.exitLabel ?? '(exit)')), value: 'exit' },
    ];

    const defaultValue = lastSelected && files.includes(lastSelected) ? lastSelected : files[0];

    const picked = await Cli.Input.Select.prompt<string>({
      message: `${args.label}:\n`,
      options,
      default: defaultValue,
      hideDefault: true,
    });

    if (picked === 'exit') return { kind: 'exit' };
    if (picked !== ADD_VALUE) {
      const selected = picked as t.StringFile;
      lastSelected = selected;
      const res = await actionMenu({ ...args, path: selected, ext });
      if (res.kind === 'back') {
        files = await listConfigs(dir, ext);
        if (files.length === 0) {
          await ensureDefaultConfig(dir, args.schema, DEFAULT.NAME, ext);
          files = await listConfigs(dir, ext);
        }
        continue;
      }
      return res;
    }

    const name = await Cli.Input.Text.prompt({
      message: 'Config name',
      hint: 'letters, numbers, ".", "_" or "-" (e.g. example)',
      validate(value) {
        const trimmed = String(value ?? '').trim();
        if (!trimmed) return 'Name required.';
        if (!NAME_REGEX.test(trimmed)) return 'Invalid name.';
        const filename = fileOf(trimmed, ext);
        if (files.some((p) => Fs.basename(p) === filename)) return 'Name already exists.';
        return true;
      },
    });

    const filename = fileOf(name.trim(), ext);
    const path = Fs.join(dir, filename);
    await writeYaml(path, args.schema.init(), args.schema);
    files = await listConfigs(dir, ext);
    lastSelected = path;
  }
}

async function actionMenu<T, A extends string = string>(args: {
  cwd: t.StringDir;
  path: t.StringFile;
  ext: string;
  schema: YamlConfigMenuArgs<T, A>['schema'];
  invalid?: YamlConfigMenuArgs<T, A>['invalid'];
  actions?: YamlConfigMenuArgs<T, A>['actions'];
}): Promise<YamlConfigMenuResult<A>> {
  let current = args.path;
  let lastAction: YamlConfigMenuActionBase | A | undefined;
  while (true) {
    const check = await validateYaml(current, args.schema);
    const action = await promptAction({
      name: fileLabel(current, args.ext),
      valid: check.ok,
      invalidLabel: args.invalid?.label,
      allow: args.invalid?.allow,
      defaultValue: lastAction,
      extra: args.actions?.extra,
    });
    lastAction = action;

    if (action === 'back') return { kind: 'back' };
    if (action === 'exit') return { kind: 'exit' };
    if (action === 'edit') {
      const openTarget = Fs.Path.trimCwd(current, { cwd: args.cwd, prefix: true });
      Open.invokeDetached(args.cwd, openTarget.length > 0 ? openTarget : current, { silent: true });
      continue;
    }
    if (action === 'reload') continue;
    if (action === 'rename') {
      const next = await renameConfig(current, args.ext);
      if (next) current = next;
      continue;
    }
    if (action === 'delete') {
      const yes = await Cli.Input.Confirm.prompt({
        message: `Delete ${c.cyan(fileLabel(current, args.ext))}?`,
        default: false,
      });
      if (!yes) continue;
      await Fs.remove(current);
      return { kind: 'back' };
    }

    if (args.actions?.onAction) {
      return await args.actions.onAction({ action, path: current });
    }
    return { kind: 'action', action, path: current };
  }
}

async function renameConfig(
  path: t.StringFile,
  ext: t.StringPath,
): Promise<t.StringFile | undefined> {
  const dir = Fs.dirname(path);
  const name = fileLabel(path, ext);
  const raw = await Cli.Input.Text.prompt({
    message: 'Config name',
    default: name,
    validate(value) {
      const trimmed = String(value ?? '').trim();
      if (!trimmed) return 'Name required.';
      if (!NAME_REGEX.test(trimmed)) return 'Invalid name.';
      const filename = fileOf(trimmed, ext);
      return Fs.exists(Fs.join(dir, filename)).then((exists) =>
        exists && trimmed !== name ? 'Name already exists.' : true,
      );
    },
  });

  const nextName = raw.trim();
  if (nextName === name) return;

  const nextFile = Fs.join(dir, fileOf(nextName, ext));
  await Fs.move(path, nextFile);
  return nextFile;
}

async function promptAction<A extends string = string>(args: {
  name: string;
  valid: boolean;
  invalidLabel?: string;
  allow?: YamlConfigMenuActionBase[];
  defaultValue?: YamlConfigMenuActionBase | A;
  extra?: { name: string; value: A }[];
}): Promise<YamlConfigMenuActionBase | A> {
  const extras = args.extra ?? [];
  const base = [
    { name: '  config: edit', value: 'edit' },
    { name: '  config: reload', value: 'reload' },
    { name: '  config: rename', value: 'rename' },
    { name: c.dim(c.gray(' (delete)')), value: 'delete' },
    { name: `${c.cyan('←')} back`, value: 'back' },
  ];

  const all = [...extras.map((item) => ({ name: `  ${item.name}`, value: item.value })), ...base];

  const allowed = args.valid
    ? all
    : all.filter((opt) =>
        (args.allow ?? ['edit', 'reload', 'rename', 'delete', 'back']).includes(
          opt.value as YamlConfigMenuActionBase,
        ),
      );

  const answer = await Cli.Input.Select.prompt<YamlConfigMenuActionBase | A>({
    message: args.valid ? 'Actions:' : `Actions: ${c.yellow(args.invalidLabel ?? 'invalid yaml')}`,
    options: allowed,
    default: args.defaultValue,
    hideDefault: true,
  });
  return answer as YamlConfigMenuActionBase | A;
}

function withTree(paths: readonly string[], ext: string) {
  return paths.map((path, i) => {
    const last = i === paths.length - 1;
    return { path, label: fileLabel(path, ext), tree: c.gray(Fmt.Tree.branch(last)) };
  });
}
