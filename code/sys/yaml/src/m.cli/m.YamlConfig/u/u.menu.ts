import { c, Cli, DEFAULT, Fs, type t } from '../common.ts';
import { ensureConfigDir, fileOf, listConfigs, readYaml, writeYaml } from './u.fs.ts';
import { actionMenu } from './u.menu.action.ts';
import { ADD_VALUE, NAME_REGEX } from './u.menu.constants.ts';
import { withTree } from './u.menu.tree.ts';

export async function menu<T, A extends string = string>(
  args: t.YamlConfig.Menu.Args<T, A>,
): Promise<t.YamlConfig.Menu.Result<A>> {
  const { ext = DEFAULT.EXT, mode = 'menu', defaultAction } = args;
  const dir = await ensureConfigDir(args.cwd, args.dir);

  if (mode === 'action') {
    const path = args.path ?? args.defaultPath;
    if (!path) return { kind: 'back' };
    return await actionMenu({ ...args, path, ext, defaultAction });
  }

  let files = await listConfigs(dir, ext);
  if (files.length === 0 && args.ensureDefault !== false) {
    await writeInitialConfig(args, dir, args.defaultName ?? DEFAULT.NAME, ext);
    files = await listConfigs(dir, ext);
  }

  let lastSelected: t.StringFile | undefined = args.defaultPath;
  while (true) {
    const itemLabel = args.itemLabel ?? 'config';
    const baseIndent = args.indent ?? ' ';
    const addValue = normalizeAddLabel(args.addLabel);

    const treeRows: Array<{
      readonly label: string;
      readonly tree: string;
      readonly value: string;
      readonly path: t.StringFile;
    }> = [];
    const needsDoc = typeof args.itemLabel === 'function' || typeof args.itemValue === 'function';
    for (const item of withTree(files, ext)) {
      const doc = needsDoc ? await readYaml<T>(item.path) : undefined;
      const itemArgs = { name: item.label, path: item.path, doc };
      treeRows.push({
        label: resolveItemName(itemLabel, itemArgs),
        tree: item.tree,
        value: resolveItemName(args.itemValue, itemArgs),
        path: item.path,
      });
    }

    const labelWidth = Math.max('add'.length, ...treeRows.map((row) => row.label.length));
    const addLabelWidth = files.length > 0 ? labelWidth : 'add'.length;
    const addLabel = `${baseIndent}${padLabel('add', addLabelWidth)}: ${addValue}`;
    const tree = treeRows.map((row) => ({
      name: `${baseIndent}${padLabel(row.label, labelWidth)}: ${row.tree} ${c.cyan(row.value)}`,
      value: row.path,
    }));

    const options = [
      { name: addLabel, value: ADD_VALUE },
      ...tree,
      { name: c.gray(c.dim(args.exitLabel ?? '(exit)')), value: 'exit' },
    ];

    const defaultValue = lastSelected && files.includes(lastSelected) ? lastSelected : files[0];

    const picked = await Cli.Input.Select.prompt<string>({
      message: args.label.length === 0 ? '' : `${args.label}:`,
      options,
      default: defaultValue,
      hideDefault: true,
    });

    if (picked === 'exit') return { kind: 'exit' };
    if (picked !== ADD_VALUE) {
      const selected = picked as t.StringFile;
      lastSelected = selected;
      if (mode === 'select') {
        return {
          kind: 'action',
          action: (args.selectAction ?? ('select' as A)) as A,
          path: selected,
        };
      }
      const res = await actionMenu({ ...args, path: selected, ext, defaultAction });
      if (res.kind === 'back') {
        files = await listConfigs(dir, ext);
        if (files.length === 0 && args.ensureDefault !== false) {
          await writeInitialConfig(args, dir, args.defaultName ?? DEFAULT.NAME, ext);
          files = await listConfigs(dir, ext);
        }
        continue;
      }
      return res;
    }

    const name = await Cli.Input.Text.prompt({
      message: args.add?.message ?? 'Config name',
      hint: args.add?.hint ?? 'letters, numbers, ".", "_" or "-" (e.g. example)',
      validate: async (value) => {
        const trimmed = String(value ?? '').trim();
        if (!trimmed) return 'Name required.';
        if (args.add?.validate) {
          const res = await args.add.validate(trimmed);
          if (res !== true) return res;
        } else if (!NAME_REGEX.test(trimmed)) {
          return 'Invalid name.';
        }
        const filename = fileOf(trimmed, ext);
        if (files.some((p) => Fs.basename(p) === filename)) return 'Name already exists.';
        return true;
      },
    });

    const filename = fileOf(name.trim(), ext);
    const path = Fs.join(dir, filename);
    await writeInitialConfig(args, dir, name.trim(), ext);
    files = await listConfigs(dir, ext);
    lastSelected = path;
  }
}

/**
 * Helpers:
 */
function normalizeAddLabel(label?: string): string {
  const raw = String(label ?? '<config>').trim();
  if (raw.includes(':')) {
    const parts = raw.split(':');
    return parts.slice(1).join(':').trim() || '<config>';
  }
  return raw;
}

async function writeInitialConfig<T, A extends string>(
  args: t.YamlConfig.Menu.Args<T, A>,
  dir: t.StringDir,
  name: string,
  ext: string,
) {
  const path = Fs.join(dir, fileOf(name, ext));
  if (await Fs.exists(path)) return;

  if (!args.add?.initYaml) {
    if (!args.schema.init) {
      throw new Error('YamlConfig: schema.init is required when add.initYaml is not provided');
    }
    await writeYaml(path, args.schema.init(), args.schema);
    return;
  }

  await Fs.write(path, args.add.initYaml({ name, doc: args.schema.init?.() }));
}

function padLabel(label: string, width: number): string {
  const pad = Math.max(0, width - label.length);
  return `${' '.repeat(pad)}${label}`;
}

function resolveItemName<T>(
  itemName: t.YamlConfig.Menu.ItemName<T> | undefined,
  args: { name: string; path: t.StringFile; doc?: T },
): string {
  if (!itemName) return args.name;
  if (typeof itemName === 'function') return itemName(args);
  return String(itemName);
}
