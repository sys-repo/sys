import { Is, Schema, type t } from './common.ts';
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

function validateDescriptorSemantics(descriptor: t.Cell.Descriptor): t.Cell.Schema.Issue[] {
  const errors: t.Cell.Schema.Issue[] = [];
  const serviceNames = new Set<string>();

  descriptor.runtime?.services.forEach((service, index) => {
    const servicePath = `/runtime/services/${index}`;

    if (serviceNames.has(service.name)) {
      errors.push({
        kind: 'semantic',
        path: `${servicePath}/name`,
        message: `Duplicate runtime service name: ${service.name}`,
      });
    }
    serviceNames.add(service.name);
  });

  errors.push(...validateActionSemantics(descriptor.actions ?? []));

  return errors;
}

function validateActionSemantics(
  actions: readonly t.Cell.Action.Descriptor[],
): t.Cell.Schema.Issue[] {
  const errors: t.Cell.Schema.Issue[] = [];
  const actionNames = new Set<string>();
  const actionByName = new Map<string, t.Cell.Action.Descriptor>();
  const actionIndexByName = new Map<string, number>();

  actions.forEach((action, index) => {
    if (actionNames.has(action.name)) {
      errors.push({
        kind: 'semantic',
        path: `/actions/${index}/name`,
        message: `Duplicate action name: ${action.name}`,
      });
    }

    actionNames.add(action.name);
    if (!actionByName.has(action.name)) {
      actionByName.set(action.name, action);
      actionIndexByName.set(action.name, index);
    }
  });

  actions.forEach((action, actionIndex) => {
    if (!isCompositeAction(action)) return;

    action.steps.forEach((step, stepIndex) => {
      if (actionNames.has(step.action)) return;
      errors.push({
        kind: 'semantic',
        path: `/actions/${actionIndex}/steps/${stepIndex}/action`,
        message: `Unknown action reference: ${step.action}`,
      });
    });
  });

  const hasNameErrors = errors.some((error) => error.path.endsWith('/name'));
  const hasMissingRefErrors = errors.some((error) => error.message.startsWith('Unknown action'));
  if (!hasNameErrors && !hasMissingRefErrors) {
    errors.push(...validateActionCycles({ actions, actionByName, actionIndexByName }));
  }

  return errors;
}

function validateActionCycles(args: {
  readonly actions: readonly t.Cell.Action.Descriptor[];
  readonly actionByName: ReadonlyMap<string, t.Cell.Action.Descriptor>;
  readonly actionIndexByName: ReadonlyMap<string, number>;
}): t.Cell.Schema.Issue[] {
  const { actions, actionByName, actionIndexByName } = args;
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const stack: string[] = [];

  for (const action of actions) {
    const issue = visitAction(action.name);
    if (issue) return [issue];
  }

  return [];

  function visitAction(name: string): t.Cell.Schema.Issue | undefined {
    if (visited.has(name)) return undefined;

    const action = actionByName.get(name);
    if (!action) return undefined;

    if (!isCompositeAction(action)) {
      visited.add(name);
      return undefined;
    }

    visiting.add(name);
    stack.push(name);

    for (let index = 0; index < action.steps.length; index += 1) {
      const step = action.steps[index];
      if (visiting.has(step.action)) {
        const cycleStart = stack.indexOf(step.action);
        const cycle = [...stack.slice(cycleStart), step.action];
        return {
          kind: 'semantic',
          path: `/actions/${actionIndexByName.get(action.name) ?? 0}/steps/${index}/action`,
          message: `Action cycle detected: ${cycle.join(' -> ')}`,
        };
      }

      const issue = visitAction(step.action);
      if (issue) return issue;
    }

    stack.pop();
    visiting.delete(name);
    visited.add(name);
    return undefined;
  }
}

function isCompositeAction(
  action: t.Cell.Action.Descriptor,
): action is t.Cell.Action.Composite {
  return Is.array((action as { readonly steps?: unknown }).steps);
}
