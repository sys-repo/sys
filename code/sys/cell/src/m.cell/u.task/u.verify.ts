import { Is, type t } from './common.ts';
import { resolveTaskConfigPath, resolveTaskEndpointAddress } from './u.resolve.ts';

export const verify: t.Cell.Task.Lib['verify'] = async (cell, options = {}) => {
  const descriptors = cell.descriptor.tasks ?? [];
  const byName = taskMapOf(descriptors);

  verifyTaskGraph(descriptors, byName, 'Cell.Task.verify');

  const tasks: t.Cell.Task.VerifiedTask[] = [];
  for (const task of descriptors) {
    tasks.push(await verifyTaskDescriptor(cell, task, options));
  }

  return { tasks };
};

/**
 * Helpers:
 */
export function taskMapOf(tasks: readonly t.Cell.Task.Descriptor[]) {
  const byName = new Map<string, t.Cell.Task.Descriptor>();
  tasks.forEach((task) => {
    if (!byName.has(task.name)) byName.set(task.name, task);
  });
  return byName;
}

export function verifyTaskGraph(
  tasks: readonly t.Cell.Task.Descriptor[],
  byName: ReadonlyMap<string, t.Cell.Task.Descriptor>,
  context: string,
) {
  verifyReferences(tasks, byName, context);
  verifyCycles(tasks, byName, context);
}

function verifyReferences(
  tasks: readonly t.Cell.Task.Descriptor[],
  byName: ReadonlyMap<string, t.Cell.Task.Descriptor>,
  context: string,
) {
  for (const task of tasks) {
    if (!isCompositeTask(task)) continue;

    for (const step of task.steps) {
      if (byName.has(step.task)) continue;
      throw new Error(`${context}: task '${task.name}' references unknown task '${step.task}'.`);
    }
  }
}

function verifyCycles(
  tasks: readonly t.Cell.Task.Descriptor[],
  byName: ReadonlyMap<string, t.Cell.Task.Descriptor>,
  context: string,
) {
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const stack: string[] = [];

  for (const task of tasks) visit(task.name);

  function visit(name: string) {
    if (visited.has(name)) return;

    const task = byName.get(name);
    if (!task) return;

    if (!isCompositeTask(task)) {
      visited.add(name);
      return;
    }

    if (visiting.has(name)) {
      const cycleStart = stack.indexOf(name);
      const cycle = [...stack.slice(cycleStart), name];
      throw new Error(`${context}: task cycle detected: ${cycle.join(' -> ')}`);
    }

    visiting.add(name);
    stack.push(name);

    for (const step of task.steps) visit(step.task);

    stack.pop();
    visiting.delete(name);
    visited.add(name);
  }
}

export async function verifyTaskDescriptor(
  cell: t.Cell.Instance,
  task: t.Cell.Task.Descriptor,
  options: t.Cell.Task.VerifyOptions,
): Promise<t.Cell.Task.VerifiedTask> {
  if (isCompositeTask(task)) return { kind: 'composite', task };

  const address = resolveTaskEndpointAddress(cell, task, options, 'Cell.Task.verify');
  const configPath = task.config
    ? resolveTaskConfigPath(cell.root, task, task.config, 'Cell.Task.verify')
    : undefined;
  const endpoint = await loadEndpoint(task, address);

  return {
    kind: 'leaf',
    task,
    paths: configPath ? { config: configPath } : {},
    endpoint,
  };
}

async function loadEndpoint(
  task: t.Cell.Task.Leaf,
  address: t.Cell.Task.PlannedEndpoint,
): Promise<t.Cell.Task.Endpoint> {
  let mod: unknown;
  try {
    mod = await import(/* @vite-ignore */ address.specifier);
  } catch (cause) {
    const err = `Cell.Task.verify: failed to import task '${task.name}': ${task.from}`;
    throw new Error(err, { cause });
  }

  const endpointName = address.use;
  const endpoint = (mod as Record<string, unknown>)[endpointName];

  if (!Is.record(endpoint) || !Is.func(endpoint.run)) {
    const err =
      `Cell.Task.verify: '${task.from}' use '${endpointName}' must expose run(...) for task '${task.name}'.`;
    throw new Error(err);
  }

  return endpoint as t.Cell.Task.Endpoint;
}

export function isCompositeTask(
  task: t.Cell.Task.Descriptor,
): task is t.Cell.Task.Composite {
  return Is.array((task as { readonly steps?: unknown }).steps);
}
