import { type t } from './common.ts';
import { resolveTaskConfigPath, resolveTaskEndpointAddress } from './u.resolve.ts';
import { isCompositeTask, taskMapOf, verifyTaskGraph } from './u.verify.ts';

export const plan: t.Cell.Task.Lib['plan'] = async (cell, name, options = {}) => {
  const descriptors = cell.descriptor.tasks ?? [];
  const descriptorByName = taskMapOf(descriptors);

  verifyTaskGraph(descriptors, descriptorByName, 'Cell.Task.plan');

  const rootTask = descriptorByName.get(name);
  if (!rootTask) throw new Error(`Cell.Task.plan: unknown task '${name}'.`);

  const leaves: t.Cell.Task.PlanLeaf[] = [];
  const tree = planTask(cell, rootTask, descriptorByName, leaves, options);

  return {
    root: cell.root,
    task: rootTask,
    tree,
    leaves,
  };
};

/**
 * Helpers:
 */
function planTask(
  cell: t.Cell.Instance,
  task: t.Cell.Task.Descriptor,
  byName: ReadonlyMap<string, t.Cell.Task.Descriptor>,
  leaves: t.Cell.Task.PlanLeaf[],
  options: t.Cell.Task.PlanOptions,
): t.Cell.Task.PlanNode {
  if (!isCompositeTask(task)) {
    const leaf = planLeaf(cell, task, options);
    leaves.push(leaf);
    return leaf;
  }

  return {
    kind: 'composite',
    task,
    steps: task.steps.map((step) => {
      const child = byName.get(step.task);
      if (!child) throw new Error(`Cell.Task.plan: unknown task '${step.task}'.`);
      return planTask(cell, child, byName, leaves, options);
    }),
  };
}

function planLeaf(
  cell: t.Cell.Instance,
  task: t.Cell.Task.Leaf,
  options: t.Cell.Task.PlanOptions,
): t.Cell.Task.PlanLeaf {
  const endpoint = resolveTaskEndpointAddress(cell, task, options, 'Cell.Task.plan');
  const configPath = task.config
    ? resolveTaskConfigPath(cell.root, task, task.config, 'Cell.Task.plan')
    : undefined;

  return {
    kind: 'leaf',
    task,
    paths: configPath ? { config: configPath } : {},
    endpoint,
  };
}
