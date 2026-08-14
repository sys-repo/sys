import { c, Fs, Open, type t } from '../common.ts';
import { fileLabel, readYaml } from './u.fs.ts';
import { promptActionWith } from './u.menu.prompt.ts';
import { defaultMenuPrompts, type MenuPromptDeps } from './u.menu.prompts.ts';
import { renameConfigWith } from './u.menu.rename.ts';

type ActionMenuArgs<T, A extends string> = {
  cwd: t.StringDir;
  path: t.StringFile;
  ext: string;
  beforePrompt?: t.YamlConfig.Menu.Args<T, A>['beforePrompt'];
  defaultAction?: t.YamlConfig.Menu.ActionBase | A;
  schema: t.YamlConfig.Menu.Args<T, A>['schema'];
  invalid?: t.YamlConfig.Menu.Args<T, A>['invalid'];
  actions?: t.YamlConfig.Menu.Args<T, A>['actions'];
};

export async function actionMenu<T, A extends string = string>(
  args: ActionMenuArgs<T, A>,
): Promise<t.YamlConfig.Menu.Result<A>> {
  return await actionMenuWith(args, defaultMenuPrompts());
}

/** Package-internal action menu parameterized by input operations. */
export async function actionMenuWith<T, A extends string = string>(
  args: ActionMenuArgs<T, A>,
  prompts: MenuPromptDeps,
): Promise<t.YamlConfig.Menu.Result<A>> {
  let current = args.path;
  let lastAction: t.YamlConfig.Menu.ActionBase | A | undefined = args.defaultAction;
  while (true) {
    const doc = await readYaml<T>(current);
    const check = doc ? args.schema.validate(doc) : { ok: false, errors: [] };
    const action = await promptActionWith<A, T>({
      name: fileLabel(current, args.ext),
      path: current,
      doc: check.ok ? doc : undefined,
      valid: check.ok,
      invalidLabel: args.invalid?.label,
      allow: args.invalid?.allow,
      defaultValue: lastAction,
      message: args.actions?.message,
      beforePrompt: args.beforePrompt,
      actionLabel: args.actions?.label,
      labelMode: args.actions?.labelMode,
      deleteLabel: args.actions?.deleteLabel,
      extra: args.actions?.extra,
      extraAfter: args.actions?.extraAfter,
    }, prompts);
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
      await args.beforePrompt?.();
      const next = await renameConfigWith(current, args.ext, prompts);
      if (next) current = next;
      continue;
    }
    if (action === 'delete') {
      await args.beforePrompt?.();
      const yes = await prompts.confirm({
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
