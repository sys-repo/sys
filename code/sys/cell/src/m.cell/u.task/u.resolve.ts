import { Path, Str, type t } from './common.ts';
import { endpointNameOf, resolveEndpointRef } from '../u/endpoints.ts';

export function resolveTaskEndpointAddress(
  cell: t.Cell.Instance,
  task: t.Cell.Task.Leaf,
  options: t.Cell.Task.TrustOptions,
  context: string,
): t.Cell.Task.PlannedEndpoint {
  const use = endpointNameOf(task);
  const ref = resolveEndpointRef({
    root: cell.root,
    from: task.from,
    name: task.name,
    kind: 'task',
    context,
    trusted: options.trusted,
  });

  return {
    use,
    from: task.from,
    specifier: ref.specifier,
    source: ref.source,
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

  if (!Path.Is.within(rootAbs, resolved)) {
    throw new Error(
      `${context}: config for '${task.name}' escapes Cell root: ${path}`,
    );
  }

  return resolved;
}

