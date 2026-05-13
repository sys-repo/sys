import { D, Path, Str, type t } from './common.ts';
import { endpointNameOf } from '../u.endpoint.ts';
import { Fs } from '@sys/fs';

export function resolveTaskEndpointAddress(
  cell: t.Cell.Instance,
  task: t.Cell.Task.Leaf,
  options: t.Cell.Task.TrustOptions,
  context: string,
): t.Cell.Task.PlannedEndpoint {
  const from = task.from.trim();
  const use = endpointNameOf(task);

  if (Path.Is.absolute(from)) {
    throw new Error(
      `${context}: absolute task import for '${task.name}' is not allowed: ${from}`,
    );
  }

  if (isRelativeSpecifier(from)) {
    return {
      from: task.from,
      use,
      specifier: resolveLocalImportSpecifier(cell, task, from, context),
      source: 'local',
    };
  }

  const trusted = options.trusted ?? D.trusted;
  const ok = trusted.some((prefix) => from.startsWith(prefix));
  if (!ok) {
    throw new Error(`${context}: untrusted task import for '${task.name}': ${from}`);
  }

  return {
    from: task.from,
    use,
    specifier: from,
    source: 'trusted',
  };
}

export function resolveTaskConfigPath(
  root: t.StringDir,
  task: t.Cell.Task.Leaf,
  path: t.Cell.Path,
  context: string,
): t.StringPath {
  const rootAbs = Path.resolve(root, '.');
  const relative = Str.trimLeadingDotSlash(path);
  const resolved = Path.resolve(rootAbs, relative);

  if (!isInsideRoot(rootAbs, resolved)) {
    throw new Error(
      `${context}: config for '${task.name}' escapes Cell root: ${path}`,
    );
  }

  return resolved;
}

/**
 * Helpers:
 */
function resolveLocalImportSpecifier(
  cell: t.Cell.Instance,
  task: t.Cell.Task.Leaf,
  from: string,
  context: string,
): string {
  const root = Path.resolve(cell.root, '.');
  const path = Path.resolve(root, from);

  if (!isInsideRoot(root, path)) {
    throw new Error(
      `${context}: local task import for '${task.name}' escapes Cell root: ${from}`,
    );
  }

  return String(Fs.Path.toFileUrl(path));
}

function isInsideRoot(root: string, path: string) {
  const relative = Path.relative(root, path);
  return relative === '' || (!relative.startsWith('..') && !Path.Is.absolute(relative));
}

function isRelativeSpecifier(value: string) {
  return value.startsWith('./') || value.startsWith('../');
}
