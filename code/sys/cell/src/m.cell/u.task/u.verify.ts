import { Is, Path, Str, type t } from './common.ts';
import { Fs } from '@sys/fs';

const DEFAULT_TRUSTED = ['@sys/'] as const;

export const verify: t.Cell.Task.Lib['verify'] = async (cell, options = {}) => {
  const descriptors = cell.descriptor.tasks ?? [];
  const byName = taskMapOf(descriptors);

  verifyTaskGraph(descriptors, byName);

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
) {
  verifyReferences(tasks, byName);
  verifyCycles(tasks, byName);
}

function verifyReferences(
  tasks: readonly t.Cell.Task.Descriptor[],
  byName: ReadonlyMap<string, t.Cell.Task.Descriptor>,
) {
  for (const task of tasks) {
    if (!isCompositeTask(task)) continue;

    for (const step of task.steps) {
      if (byName.has(step.task)) continue;
      throw new Error(
        `Cell.Task.verify: task '${task.name}' references unknown task '${step.task}'.`,
      );
    }
  }
}

function verifyCycles(
  tasks: readonly t.Cell.Task.Descriptor[],
  byName: ReadonlyMap<string, t.Cell.Task.Descriptor>,
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
      throw new Error(`Cell.Task.verify: task cycle detected: ${cycle.join(' -> ')}`);
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

  const specifier = resolveImportSpecifier(cell, task, options);
  const configPath = task.config ? resolveCellPath(cell.root, task, task.config) : undefined;
  const endpoint = await loadEndpoint(task, specifier);

  return {
    kind: 'leaf',
    task,
    paths: configPath ? { config: configPath } : {},
    endpoint,
  };
}

function resolveImportSpecifier(
  cell: t.Cell.Instance,
  task: t.Cell.Task.Leaf,
  options: t.Cell.Task.VerifyOptions,
): string {
  const from = task.from.trim();

  if (Path.Is.absolute(from)) {
    throw new Error(
      `Cell.Task.verify: absolute task import for '${task.name}' is not allowed: ${from}`,
    );
  }

  if (isRelativeSpecifier(from)) return resolveLocalImportSpecifier(cell, task, from);

  const trusted = options.trusted ?? DEFAULT_TRUSTED;
  const ok = trusted.some((prefix) => from.startsWith(prefix));
  if (!ok) {
    throw new Error(`Cell.Task.verify: untrusted task import for '${task.name}': ${from}`);
  }

  return from;
}

function resolveLocalImportSpecifier(
  cell: t.Cell.Instance,
  task: t.Cell.Task.Leaf,
  from: string,
): string {
  const root = Path.resolve(cell.root, '.');
  const path = Path.resolve(root, from) as t.StringPath;

  if (!isInsideRoot(root, path)) {
    throw new Error(
      `Cell.Task.verify: local task import for '${task.name}' escapes Cell root: ${from}`,
    );
  }

  return String(Fs.Path.toFileUrl(path));
}

async function loadEndpoint(
  task: t.Cell.Task.Leaf,
  specifier: string,
): Promise<t.Cell.Task.Endpoint> {
  let mod: unknown;
  try {
    mod = await import(/* @vite-ignore */ specifier);
  } catch (cause) {
    const err = `Cell.Task.verify: failed to import task '${task.name}': ${task.from}`;
    throw new Error(err, { cause });
  }

  const endpoint = (mod as Record<string, unknown>)[task.export];

  if (!Is.record(endpoint) || !Is.func(endpoint.run)) {
    const err =
      `Cell.Task.verify: '${task.from}' export '${task.export}' must expose run(...) for task '${task.name}'.`;
    throw new Error(err);
  }

  return endpoint as t.Cell.Task.Endpoint;
}

function resolveCellPath(
  root: t.StringDir,
  task: t.Cell.Task.Leaf,
  path: t.Cell.Path,
): t.StringPath {
  const rootAbs = Path.resolve(root, '.');
  const relative = Str.trimLeadingDotSlash(path);
  const resolved = Path.resolve(rootAbs, relative) as t.StringPath;

  if (!isInsideRoot(rootAbs, resolved)) {
    throw new Error(
      `Cell.Task.verify: config for '${task.name}' escapes Cell root: ${path}`,
    );
  }

  return resolved;
}

function isInsideRoot(root: string, path: string) {
  const relative = Path.relative(root, path);
  return relative === '' || (!relative.startsWith('..') && !Path.Is.absolute(relative));
}

function isRelativeSpecifier(value: string) {
  return value.startsWith('./') || value.startsWith('../');
}

export function isCompositeTask(
  task: t.Cell.Task.Descriptor,
): task is t.Cell.Task.Composite {
  return Is.array((task as { readonly steps?: unknown }).steps);
}
