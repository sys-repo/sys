import { type t, c, Cli, Fs, Open } from './common.ts';
import { fileLabel, validateYaml } from './u.fs.ts';
import { promptAction } from './u.menu.prompt.ts';
import { renameConfig } from './u.menu.rename.ts';
import type {
  YamlConfigMenuActionBase,
  YamlConfigMenuArgs,
  YamlConfigMenuResult,
} from './t.menu.ts';

type ActionMenuArgs<T, A extends string> = {
  cwd: t.StringDir;
  path: t.StringFile;
  ext: string;
  schema: YamlConfigMenuArgs<T, A>['schema'];
  invalid?: YamlConfigMenuArgs<T, A>['invalid'];
  actions?: YamlConfigMenuArgs<T, A>['actions'];
};

export async function actionMenu<T, A extends string = string>(
  args: ActionMenuArgs<T, A>,
): Promise<YamlConfigMenuResult<A>> {
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
