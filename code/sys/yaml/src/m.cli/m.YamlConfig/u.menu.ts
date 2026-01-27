import { type t, c, Cli, DEFAULT, Fs } from './common.ts';
import type { YamlConfigMenuArgs, YamlConfigMenuResult } from './t.menu.ts';
import { ensureConfigDir, ensureDefaultConfig, fileOf, listConfigs, writeYaml } from './u.fs.ts';
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
  if (files.length === 0) {
    await ensureDefaultConfig(dir, args.schema, DEFAULT.NAME, ext);
    files = await listConfigs(dir, ext);
  }

  let lastSelected: t.StringFile | undefined = args.defaultPath;
  while (true) {
    const tree = withTree(files, ext).map((item) => ({
      name: ` ${args.itemLabel ?? 'config'}: ${item.tree} ${c.cyan(item.label)}`,
      value: item.path,
    }));

    const options = [
      { name: args.addLabel ?? '  add: <config>', value: ADD_VALUE },
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
      const res = await actionMenu({ ...args, path: selected, ext, defaultAction });
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
