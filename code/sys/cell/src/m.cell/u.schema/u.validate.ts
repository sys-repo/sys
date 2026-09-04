import { IdPattern, Is, Schema, type t } from './common.ts';
import { DescriptorSchema } from './u.schema.descriptor.ts';

export function validateDescriptor(value: unknown): t.Cell.Schema.Validation {
  const errors: t.Cell.Schema.Issue[] = [];

  for (const error of Schema.Value.Errors(DescriptorSchema, value)) {
    errors.push({ kind: 'schema', path: error.path || '<root>', message: error.message });
  }

  if (errors.length === 0) {
    errors.push(...validateDescriptorSemantics(value as t.Cell.Descriptor));
  }

  return { ok: errors.length === 0, errors };
}

const Id = new RegExp(IdPattern);

function validateDescriptorSemantics(descriptor: t.Cell.Descriptor): t.Cell.Schema.Issue[] {
  const errors: t.Cell.Schema.Issue[] = [];
  const serviceNames = new Set<string>();

  descriptor.services?.forEach((service, index) => {
    const servicePath = `/services/${index}`;

    if (serviceNames.has(service.name)) {
      errors.push({
        kind: 'semantic',
        path: `${servicePath}/name`,
        message: `Duplicate service name: ${service.name}`,
      });
    }
    serviceNames.add(service.name);

    for (const variant of Object.keys(service.variants ?? {})) {
      if (variant === 'default') {
        errors.push({
          kind: 'semantic',
          path: `${servicePath}/variants/default`,
          message: 'Reserved service variant name: default',
        });
      } else if (!Id.test(variant)) {
        errors.push({
          kind: 'semantic',
          path: `${servicePath}/variants/${variant}`,
          message: `Invalid service variant name: ${variant}`,
        });
      }
    }
  });

  errors.push(...validateTaskSemantics(descriptor.tasks ?? []));

  return errors;
}

function validateTaskSemantics(
  tasks: readonly t.Cell.Task.Descriptor[],
): t.Cell.Schema.Issue[] {
  const errors: t.Cell.Schema.Issue[] = [];
  const taskNames = new Set<string>();
  const taskByName = new Map<string, t.Cell.Task.Descriptor>();
  const taskIndexByName = new Map<string, number>();

  tasks.forEach((task, index) => {
    if (taskNames.has(task.name)) {
      errors.push({
        kind: 'semantic',
        path: `/tasks/${index}/name`,
        message: `Duplicate task name: ${task.name}`,
      });
    }

    taskNames.add(task.name);
    if (!taskByName.has(task.name)) {
      taskByName.set(task.name, task);
      taskIndexByName.set(task.name, index);
    }
  });

  tasks.forEach((task, taskIndex) => {
    if (!isCompositeTask(task)) return;

    task.steps.forEach((step, stepIndex) => {
      if (taskNames.has(step.task)) return;
      errors.push({
        kind: 'semantic',
        path: `/tasks/${taskIndex}/steps/${stepIndex}/task`,
        message: `Unknown task reference: ${step.task}`,
      });
    });
  });

  const hasNameErrors = errors.some((error) => error.path.endsWith('/name'));
  const hasMissingRefErrors = errors.some((error) => error.message.startsWith('Unknown task'));
  if (!hasNameErrors && !hasMissingRefErrors) {
    errors.push(...validateTaskCycles({ tasks, taskByName, taskIndexByName }));
  }

  return errors;
}

function validateTaskCycles(args: {
  readonly tasks: readonly t.Cell.Task.Descriptor[];
  readonly taskByName: ReadonlyMap<string, t.Cell.Task.Descriptor>;
  readonly taskIndexByName: ReadonlyMap<string, number>;
}): t.Cell.Schema.Issue[] {
  const { tasks, taskByName, taskIndexByName } = args;
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const stack: string[] = [];

  for (const task of tasks) {
    const issue = visitTask(task.name);
    if (issue) return [issue];
  }

  return [];

  function visitTask(name: string): t.Cell.Schema.Issue | undefined {
    if (visited.has(name)) return undefined;

    const task = taskByName.get(name);
    if (!task) return undefined;

    if (!isCompositeTask(task)) {
      visited.add(name);
      return undefined;
    }

    visiting.add(name);
    stack.push(name);

    for (let index = 0; index < task.steps.length; index += 1) {
      const step = task.steps[index];
      if (visiting.has(step.task)) {
        const cycleStart = stack.indexOf(step.task);
        const cycle = [...stack.slice(cycleStart), step.task];
        return {
          kind: 'semantic',
          path: `/tasks/${taskIndexByName.get(task.name) ?? 0}/steps/${index}/task`,
          message: `Task cycle detected: ${cycle.join(' -> ')}`,
        };
      }

      const issue = visitTask(step.task);
      if (issue) return issue;
    }

    stack.pop();
    visiting.delete(name);
    visited.add(name);
    return undefined;
  }
}

function isCompositeTask(
  task: t.Cell.Task.Descriptor,
): task is t.Cell.Task.Composite {
  return Is.array((task as { readonly steps?: unknown }).steps);
}
