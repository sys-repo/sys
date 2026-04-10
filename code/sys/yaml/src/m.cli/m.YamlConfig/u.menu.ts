import { type t, c, Cli, DEFAULT, Fs } from './common.ts';
import type { YamlConfigMenuArgs, YamlConfigMenuResult } from './t.menu.ts';
import {
  ensureConfigDir,
  ensureDefaultConfig,
  fileOf,
  listConfigs,
  readYaml,
  writeYaml,
} from './u.fs.ts';
import { actionMenu } from './u.menu.action.ts';
import { ADD_VALUE, NAME_REGEX } from './u.menu.constants.ts';
import { withTree } from './u.menu.tree.ts';

export async function menu<T, A extends string = string>(
  args: YamlConfigMenuArgs<T, A>,
): Promise<YamlConfigMenuResult<A>> {
  const { ext = DEFAULT.EXT, mode = 'menu', defaultAction } = args;
  const dir = await ensureConfigDir(args.cwd, args.dir);

  if (mode === 'action') {
    const path = args.path ?? args.defaultPath;
    if (!path) return { kind: 'back' };
    return await actionMenu({ ...args, path, ext, defaultAction });
  }

  let files = await listConfigs(dir, ext);
  if (files.length === 0 && args.ensureDefault !== false) {
    const name = args.defaultName ?? DEFAULT.NAME;
    await ensureDefaultConfig(dir, args.schema, name, ext);
    files = await listConfigs(dir, ext);
  }

  let lastSelected: t.StringFile | undefined = args.defaultPath;
  while (true) {
    const itemLabel = args.itemLabel ?? 'config';
    const baseIndent = args.indent ?? ' ';
    const addValue = normalizeAddLabel(args.addLabel);
    const labelWidth = Math.max(itemLabel.length, 'add'.length);
    const addLabelWidth = files.length > 0 ? labelWidth : 'add'.length;
    const addLabel = `${baseIndent}${padLabel('add', addLabelWidth)}: ${addValue}`;

    const tree: Array<{ name: string; value: t.StringFile }> = [];
    for (const item of withTree(files, ext)) {
      const doc = args.itemValue ? await readYaml<T>(item.path) : undefined;
      const label = resolveItemValue(args.itemValue, {
        name: item.label,
        path: item.path,
        doc,
      });
      tree.push({
        name: `${baseIndent}${padLabel(itemLabel, labelWidth)}: ${item.tree} ${c.cyan(label)}`,
        value: item.path,
      });
    }

    const options = [
      { name: addLabel, value: ADD_VALUE },
      ...tree,
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
          const name = args.defaultName ?? DEFAULT.NAME;
          await ensureDefaultConfig(dir, args.schema, name, ext);
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
    if (args.add?.initYaml) {
      await Fs.write(path, args.add.initYaml({ name: name.trim(), doc: args.schema.init?.() }));
    } else {
      if (!args.schema.init) throw new Error('YamlConfig: schema.init is required when add.initYaml is not provided');
      const doc = args.schema.init();
      await writeYaml(path, doc, args.schema);
    }
    files = await listConfigs(dir, ext);
    lastSelected = path;
  }
}

function normalizeAddLabel(label?: string): string {
  const raw = String(label ?? '<config>').trim();
  if (raw.includes(':')) {
    const parts = raw.split(':');
    return parts.slice(1).join(':').trim() || '<config>';
  }
  return raw;
}

function padLabel(label: string, width: number): string {
  const pad = Math.max(0, width - label.length);
  return `${' '.repeat(pad)}${label}`;
}

function resolveItemValue<T>(
  itemValue: YamlConfigMenuArgs<T>['itemValue'],
  args: { name: string; path: t.StringFile; doc?: T },
): string {
  if (!itemValue) return args.name;
  if (typeof itemValue === 'function') return itemValue(args);
  return String(itemValue);
}
