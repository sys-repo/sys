import { type t, Deps } from './common.ts';

/**
 * Adapt local workspace packages onto the current `Esm.Topological` node shape.
 *
 * NB:
 * This is intentionally an adapter seam. Package ordering is workspace-owned,
 * while the ordering primitive is still ESM-policy-shaped.
 */
export function toNode(pkg: t.WorkspaceGraph.Package): t.EsmTopologicalInput['nodes'][number] {
  return {
    key: pkg.path,
    decision: toDecision(pkg),
  };
}

function toDecision(pkg: t.WorkspaceGraph.Package): t.EsmPolicyDecision {
  const entry = Deps.toEntry(`npm:${toPackageStem(pkg)}@0.0.0`);

  return {
    ok: true,
    input: {
      policy: { mode: 'latest' },
      subject: {
        entry,
        current: '0.0.0',
        available: ['0.0.0'],
      },
    },
    selection: {
      current: { version: '0.0.0', current: true },
      available: [],
    },
  };
}

function toPackageStem(pkg: t.WorkspaceGraph.Package) {
  const candidate = (pkg.name ?? pkg.path)
    .replace(/^@/, '')
    .replaceAll('/', '-')
    .replaceAll('_', '-')
    .replaceAll('.', '-')
    .replace(/[^a-zA-Z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return candidate || 'workspace-package';
}
