import { c, Cli, Fs, Open, type t } from './common.ts';
import type {
  YamlConfigMenuActionBase,
  YamlConfigMenuArgs,
  YamlConfigMenuResult,
} from './t.menu.ts';
import { fileLabel, readYaml } from './u.fs.ts';
import { promptAction } from './u.menu.prompt.ts';
import { renameConfig } from './u.menu.rename.ts';

type ActionMenuArgs<T, A extends string> = {
  cwd: t.StringDir;
  path: t.StringFile;
  ext: string;
  defaultAction?: YamlConfigMenuActionBase | A;
  schema: YamlConfigMenuArgs<T, A>['schema'];
  invalid?: YamlConfigMenuArgs<T, A>['invalid'];
  actions?: YamlConfigMenuArgs<T, A>['actions'];
};

export async function actionMenu<T, A extends string = string>(
  args: ActionMenuArgs<T, A>,
): Promise<YamlConfigMenuResult<A>> {
  let current = args.path;
  let lastAction: YamlConfigMenuActionBase | A | undefined = args.defaultAction;
  while (true) {
    const doc = await readYaml<T>(current);
    const check = doc ? args.schema.validate(doc) : { ok: false, errors: [] };
    const action = await promptAction<A, T>({
      name: fileLabel(current, args.ext),
      path: current,
      doc: check.ok ? doc : undefined,
      valid: check.ok,
      invalidLabel: args.invalid?.label,
      allow: args.invalid?.allow,
      defaultValue: lastAction,
      message: args.actions?.message,
      actionLabel: args.actions?.label,
      extra: args.actions?.extra,
      extraAfter: args.actions?.extraAfter,
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
      const res = await args.actions.onAction({ action, path: current });
      if (res.kind === 'stay') continue;
      return res;
    }
    return { kind: 'action', action, path: current };
  }
}
