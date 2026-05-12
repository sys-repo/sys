import { type t, Time } from './common.ts';
import { verify } from './u.verify.ts';

export const run: t.Cell.Action.Lib['run'] = async (cell, name, options = {}) => {
  const verification = await verify(cell, options);
  const byName = new Map(verification.actions.map((action) => [action.action.name, action]));
  const root = byName.get(name);

  if (!root) throw new Error(`Cell.Action.run: unknown action '${name}'.`);

  const steps: t.Cell.Action.StepResult[] = [];
  try {
    await runVerifiedAction({ cell, root, action: root, byName, options, steps });
  } catch (cause) {
    const failed = cause instanceof ActionRunFailure ? cause.action : root.action.name;
    throw new Error(
      `Cell.Action.run: failed action '${failed}' while running '${root.action.name}'.`,
      {
        cause,
      },
    );
  }

  return { action: root.action, steps };
};

/**
 * Helpers:
 */
async function runVerifiedAction(args: {
  readonly cell: t.Cell.Instance;
  readonly root: t.Cell.Action.VerifiedAction;
  readonly action: t.Cell.Action.VerifiedAction;
  readonly byName: ReadonlyMap<string, t.Cell.Action.VerifiedAction>;
  readonly options: t.Cell.Action.RunOptions;
  readonly steps: t.Cell.Action.StepResult[];
}) {
  const { action } = args;

  if (action.kind === 'leaf') return await runLeafAction({ ...args, action });

  for (const step of action.action.steps) {
    const child = args.byName.get(step.action);
    if (!child) {
      throw new ActionRunFailure(step.action, new Error(`Unknown action: ${step.action}`));
    }
    await runVerifiedAction({ ...args, action: child });
  }
}

async function runLeafAction(args: {
  readonly cell: t.Cell.Instance;
  readonly root: t.Cell.Action.VerifiedAction;
  readonly action: t.Cell.Action.VerifiedLeaf;
  readonly options: t.Cell.Action.RunOptions;
  readonly steps: t.Cell.Action.StepResult[];
}) {
  const { action, cell, options } = args;
  const base = runArgsOf(cell, action);
  const startedAt = Time.now.timestamp;

  try {
    const finalArgs = options.runArgs
      ? await options.runArgs({ cell, root: args.root.action, action, base })
      : base;
    const result = await action.endpoint.run(finalArgs);
    const resolvedAt = Time.now.timestamp;
    args.steps.push({
      action: action.action,
      ok: true,
      result,
      metrics: { run: { startedAt, resolvedAt } },
    });
  } catch (cause) {
    const resolvedAt = Time.now.timestamp;
    args.steps.push({
      action: action.action,
      ok: false,
      error: cause,
      metrics: { run: { startedAt, resolvedAt } },
    });
    throw new ActionRunFailure(action.action.name, cause);
  }
}

function runArgsOf(
  cell: t.Cell.Instance,
  action: t.Cell.Action.VerifiedLeaf,
): t.Cell.Action.RunArgs {
  const paths: t.Cell.Action.RunArgs['paths'] = action.paths.config
    ? { config: action.paths.config }
    : {};

  return action.config
    ? { cwd: cell.root, config: action.config, paths }
    : { cwd: cell.root, paths };
}

class ActionRunFailure extends Error {
  constructor(readonly action: string, cause: unknown) {
    super(`Action failed: ${action}`, { cause });
  }
}
