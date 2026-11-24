import type { t } from './common.ts';

/** Resolve startup edges against service identities, independent of descriptor order and mode. */
export function validateServicePrerequisites(
  services: readonly t.Cell.Services.Service[],
): t.Cell.Schema.Issue[] {
  const errors: t.Cell.Schema.Issue[] = [];
  const indices = new Map<string, number>();
  services.forEach(({ name }, index) => {
    if (indices.has(name)) {
      errors.push(issue(serviceNamePath(index), `Duplicate service name: ${name}`));
    }
    indices.set(name, index);
  });

  services.forEach(({ name, startAfter }, index) => {
    const seen = new Set<string>();
    startAfter?.forEach((ref, edge) => {
      const path = startAfterPath(index, edge);
      if (!indices.has(ref)) errors.push(issue(path, `Unknown service prerequisite: ${ref}`));
      else if (ref === name) errors.push(issue(path, `Service cannot start after itself: ${ref}`));
      else if (seen.has(ref)) errors.push(issue(path, `Repeated service prerequisite: ${ref}`));
      seen.add(ref);
    });
  });
  if (errors.length) return errors;

  const visited = new Set<string>();
  const visiting = new Set<string>();
  for (const { name } of services) {
    const cycle = visit(name);
    if (cycle) return [cycle];
  }
  return [];

  function visit(name: string): t.Cell.Schema.Issue | undefined {
    if (visited.has(name)) return;
    visiting.add(name);
    const index = indices.get(name)!;
    for (const [edge, ref] of (services[index].startAfter ?? []).entries()) {
      if (visiting.has(ref)) {
        const path = [...visiting];
        const cycle = [...path.slice(path.indexOf(ref)), ref].join(' → ');
        return issue(startAfterPath(index, edge), `Service startup cycle: ${cycle}`);
      }
      const cycle = visit(ref);
      if (cycle) return cycle;
    }
    visiting.delete(name);
    visited.add(name);
  }
}

/**
 * Helpers:
 */
function serviceNamePath(serviceIndex: number): string {
  return `/services/${serviceIndex}/name`;
}

function startAfterPath(serviceIndex: number, edgeIndex: number): string {
  return `/services/${serviceIndex}/startAfter/${edgeIndex}`;
}

function issue(path: string, message: string): t.Cell.Schema.Issue {
  return { kind: 'semantic', path, message };
}
