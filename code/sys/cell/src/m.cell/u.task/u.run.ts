import { type t, Time } from './common.ts';
import { isCompositeTask, taskMapOf, verifyTaskDescriptor, verifyTaskGraph } from './u.verify.ts';

export const run: t.Cell.Task.Lib['run'] = async (cell, name, options = {}) => {
  const descriptors = cell.descriptor.tasks ?? [];
  const descriptorByName = taskMapOf(descriptors);

  verifyTaskGraph(descriptors, descriptorByName);

  const rootDescriptor = descriptorByName.get(name);
  if (!rootDescriptor) throw new Error(`Cell.Task.run: unknown task '${name}'.`);

  const byName = await verifyTaskClosure(cell, rootDescriptor, descriptorByName, options);
  const root = byName.get(name);
  if (!root) throw new Error(`Cell.Task.run: unknown task '${name}'.`);

  const steps: t.Cell.Task.StepResult[] = [];
  try {
    await runVerifiedTask({ cell, root, task: root, byName, steps });
  } catch (cause) {
    const failed = cause instanceof TaskRunFailure ? cause.task : root.task.name;
    throw new Error(
      `Cell.Task.run: failed task '${failed}' while running '${root.task.name}'.`,
      {
        cause,
      },
    );
  }

  return { task: root.task, steps };
};

/**
 * Helpers:
 */
async function verifyTaskClosure(
  cell: t.Cell.Instance,
  root: t.Cell.Task.Descriptor,
  descriptorByName: ReadonlyMap<string, t.Cell.Task.Descriptor>,
  options: t.Cell.Task.RunOptions,
): Promise<ReadonlyMap<string, t.Cell.Task.VerifiedTask>> {
  const verified = new Map<string, t.Cell.Task.VerifiedTask>();

  async function visit(task: t.Cell.Task.Descriptor): Promise<void> {
    if (verified.has(task.name)) return;

    verified.set(task.name, await verifyTaskDescriptor(cell, task, options));
    if (!isCompositeTask(task)) return;

    for (const step of task.steps) {
      const child = descriptorByName.get(step.task);
      if (!child) throw new TaskRunFailure(step.task, new Error(`Unknown task: ${step.task}`));
      await visit(child);
    }
  }

  await visit(root);
  return verified;
}

async function runVerifiedTask(args: {
  readonly cell: t.Cell.Instance;
  readonly root: t.Cell.Task.VerifiedTask;
  readonly task: t.Cell.Task.VerifiedTask;
  readonly byName: ReadonlyMap<string, t.Cell.Task.VerifiedTask>;
  readonly steps: t.Cell.Task.StepResult[];
}) {
  const { task } = args;

  if (task.kind === 'leaf') return await runLeafTask({ ...args, task });

  for (const step of task.task.steps) {
    const child = args.byName.get(step.task);
    if (!child) {
      throw new TaskRunFailure(step.task, new Error(`Unknown task: ${step.task}`));
    }
    await runVerifiedTask({ ...args, task: child });
  }
}

async function runLeafTask(args: {
  readonly cell: t.Cell.Instance;
  readonly root: t.Cell.Task.VerifiedTask;
  readonly task: t.Cell.Task.VerifiedLeaf;
  readonly steps: t.Cell.Task.StepResult[];
}) {
  const { task, cell } = args;
  const finalArgs = runArgsOf(cell, task);
  const startedAt = Time.now.timestamp;

  try {
    const result = await task.endpoint.run(finalArgs);
    const resolvedAt = Time.now.timestamp;
    args.steps.push({
      task: task.task,
      ok: true,
      result,
      metrics: { run: { startedAt, resolvedAt } },
    });
  } catch (cause) {
    const resolvedAt = Time.now.timestamp;
    args.steps.push({
      task: task.task,
      ok: false,
      error: cause,
      metrics: { run: { startedAt, resolvedAt } },
    });
    throw new TaskRunFailure(task.task.name, cause);
  }
}

function runArgsOf(
  cell: t.Cell.Instance,
  task: t.Cell.Task.VerifiedLeaf,
): t.Cell.Task.RunArgs {
  const paths: t.Cell.Task.RunArgs['paths'] = task.paths.config
    ? { config: task.paths.config }
    : {};

  return { cwd: cell.root, paths };
}

class TaskRunFailure extends Error {
  constructor(readonly task: string, cause: unknown) {
    super(`Task failed: ${task}`, { cause });
  }
}
