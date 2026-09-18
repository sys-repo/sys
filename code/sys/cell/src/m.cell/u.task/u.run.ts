import { type t, Time } from './common.ts';
import { isCompositeTask, taskMapOf, verifyTaskDescriptor, verifyTaskGraph } from './u.verify.ts';

type RunState = {
  readonly byName: ReadonlyMap<string, t.Cell.Task.VerifiedTask>;
  readonly root: t.Cell.Task.VerifiedTask;
};

export const run: t.Cell.Task.Lib['run'] = async (cell, name, options = {}) => {
  const emit = telemetryEmitter(options.onEvent);
  const descriptors = cell.descriptor.tasks ?? [];
  const descriptorByName = taskMapOf(descriptors);

  verifyTaskGraph(descriptors, descriptorByName, 'Cell.Task.run');

  const rootDescriptor = descriptorByName.get(name);
  if (!rootDescriptor) throw new Error(`Cell.Task.run: unknown task '${name}'.`);

  const steps: t.Cell.Task.StepResult[] = [];
  emit({
    kind: 'task:start',
    task: rootDescriptor,
    leaves: leafTasksOf(rootDescriptor, descriptorByName),
  });

  const { byName, root } = await verifyRunState({
    cell,
    name,
    rootTask: rootDescriptor,
    descriptorByName,
    options,
    steps,
    emit,
  });

  try {
    await runVerifiedTask({ cell, root, task: root, byName, steps, emit });
    emit({ kind: 'task:ok', task: root.task, steps });

    return { task: root.task, steps };
  } catch (cause) {
    emit({ kind: 'task:fail', task: rootDescriptor, error: cause, steps });
    if (!(cause instanceof TaskRunFailure)) throw cause;
    throw new Error(
      `Cell.Task.run: failed task '${cause.task}' while running '${rootDescriptor.name}'.`,
      { cause },
    );
  }
};

/**
 * Helpers:
 */
function leafTasksOf(
  task: t.Cell.Task.Descriptor,
  byName: ReadonlyMap<string, t.Cell.Task.Descriptor>,
): t.Cell.Task.Leaf[] {
  if (!isCompositeTask(task)) return [task];

  return task.steps.flatMap((step) => {
    const child = byName.get(step.task);
    if (!child) throw new TaskRunFailure(step.task, new Error(`Unknown task: ${step.task}`));
    return leafTasksOf(child, byName);
  });
}

async function verifyRunState(args: {
  cell: t.Cell.Instance;
  name: t.Cell.Id;
  rootTask: t.Cell.Task.Descriptor;
  descriptorByName: ReadonlyMap<string, t.Cell.Task.Descriptor>;
  options: t.Cell.Task.Run.Options;
  steps: t.Cell.Task.StepResult[];
  emit: t.Cell.Task.Run.EventHandler;
}): Promise<RunState> {
  try {
    const byName = await verifyTaskClosure(
      args.cell,
      args.rootTask,
      args.descriptorByName,
      args.options,
    );
    const root = byName.get(args.name);
    if (!root) throw new Error(`Cell.Task.run: unknown task '${args.name}'.`);
    return { byName, root };
  } catch (cause) {
    args.emit({
      kind: 'task:fail',
      task: args.rootTask,
      error: cause,
      steps: args.steps,
    });
    throw cause;
  }
}

async function verifyTaskClosure(
  cell: t.Cell.Instance,
  root: t.Cell.Task.Descriptor,
  descriptorByName: ReadonlyMap<string, t.Cell.Task.Descriptor>,
  options: t.Cell.Task.Run.Options,
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
  cell: t.Cell.Instance;
  root: t.Cell.Task.VerifiedTask;
  task: t.Cell.Task.VerifiedTask;
  byName: ReadonlyMap<string, t.Cell.Task.VerifiedTask>;
  steps: t.Cell.Task.StepResult[];
  emit: t.Cell.Task.Run.EventHandler;
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
  cell: t.Cell.Instance;
  root: t.Cell.Task.VerifiedTask;
  task: t.Cell.Task.VerifiedLeaf;
  steps: t.Cell.Task.StepResult[];
  emit: t.Cell.Task.Run.EventHandler;
}) {
  const { task, cell, emit } = args;
  const finalArgs = runArgsOf(cell, task);
  const startedAt = Time.now.timestamp;

  emit({ kind: 'task:step:start', rootTask: args.root.task, step: task.task });

  let result: unknown;
  try {
    result = await task.endpoint.run(finalArgs);
  } catch (cause) {
    const resolvedAt = Time.now.timestamp;
    const step: t.Cell.Task.StepResult = {
      task: task.task,
      ok: false,
      error: cause,
      metrics: { run: { startedAt, resolvedAt } },
    };
    args.steps.push(step);
    emit({
      kind: 'task:step:fail',
      rootTask: args.root.task,
      step: task.task,
      result: step,
    });
    throw new TaskRunFailure(task.task.name, cause);
  }

  const resolvedAt = Time.now.timestamp;
  const step: t.Cell.Task.StepResult = {
    task: task.task,
    ok: true,
    result,
    metrics: { run: { startedAt, resolvedAt } },
  };
  args.steps.push(step);
  emit({ kind: 'task:step:ok', rootTask: args.root.task, step: task.task, result: step });
}

function telemetryEmitter(handler?: t.Cell.Task.Run.EventHandler): t.Cell.Task.Run.EventHandler {
  if (!handler) return () => undefined;
  return (event) => {
    try {
      handler(event);
    } catch {
      // Telemetry observers must not change task execution semantics.
    }
  };
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
