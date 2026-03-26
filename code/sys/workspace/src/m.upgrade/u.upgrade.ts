import { type t, Esm } from './common.ts';
import { collectWithSession } from './u.collect.ts';
import { createSession, Session, type UpgradeSession } from './u.session.ts';

export const upgrade: t.WorkspaceUpgrade.Lib['upgrade'] = async (input, options) => {
  return await upgradeWithSession(input, options, createSession());
};

/**
 * Internal session-aware planning helper for multi-phase upgrade orchestration.
 */
export async function upgradeWithSession(
  input: t.WorkspaceUpgrade.Input,
  options: t.WorkspaceUpgrade.Options | undefined,
  session: UpgradeSession,
): Promise<t.WorkspaceUpgrade.Result> {
  const collected = await collectWithSession(input, options, session);
  collected.options.progress?.({ kind: 'plan' });
  const policy = Esm.Policy.decideAll(collected.candidates.map(wrangle.policyInput(collected.options)));
  const graph = await wrangle.graph(policy, session);
  const topological = Esm.Topological.build({ nodes: graph.nodes, edges: graph.edges });

  return {
    input: collected.input,
    options: collected.options,
    collect: collected,
    policy,
    graph,
    topological,
    totals: wrangle.totals(collected, policy, topological),
  };
}

const wrangle = {
  policyInput(options: t.WorkspaceUpgrade.ResolvedOptions) {
    return (candidate: t.WorkspaceUpgrade.Candidate): t.EsmPolicyInput => ({
      policy: options.policy,
      subject: {
        entry: candidate.entry,
        current: candidate.current,
        available: candidate.available,
      },
    });
  },

  async graph(policy: t.EsmPolicyResult, session: UpgradeSession): Promise<t.WorkspaceUpgrade.Graph> {
    const nodes = policy.decisions
      .filter((decision): decision is t.EsmPolicyDecision & { ok: true } => decision.ok)
      .map((decision) => ({
        key: wrangle.key(decision.input.subject.entry),
        value: decision,
      }));

    const nodeKeys = new Set(nodes.map((node) => node.key));
    const edges = new Map<string, t.EsmTopologicalInput['edges'][number]>();
    const unresolved: t.WorkspaceUpgrade.GraphUnresolved[] = [];

    for (const node of nodes) {
      const entry = node.value.input.subject.entry;
      const selected = node.value.selection.selected?.version;
      if (!selected) continue;

      if (entry.module.registry === 'npm') {
        const res = await Session.npmInfo(session, wrangle.npmEntry(entry), selected);
        if (!res.ok || !res.data) {
          unresolved.push({
            entry,
            reason: {
              code: 'registry:info',
              message: res.error?.message ?? `Failed to derive npm graph metadata for ${entry.module.name}`,
            },
          });
          continue;
        }

        for (const depName of Object.keys(res.data.dependencies ?? {}).sort((a, b) => a.localeCompare(b))) {
          const from = `npm:${depName}`;
          if (!nodeKeys.has(from)) continue;
          const edge: t.EsmTopologicalInput['edges'][number] = { from, to: node.key };
          edges.set(`${edge.from}->${edge.to}`, edge);
        }
        continue;
      }

      if (entry.module.registry === 'jsr') {
        const res = await Session.jsrInfo(session, wrangle.jsrEntry(entry), selected);
        if (!res.ok || !res.data) {
          unresolved.push({
            entry,
            reason: {
              code: 'registry:info',
              message: res.error?.message ?? `Failed to derive JSR graph metadata for ${entry.module.name}`,
            },
          });
          continue;
        }

        if (!res.data.graph) {
          unresolved.push({
            entry,
            reason: {
              code: 'registry:graph',
              message: `JSR graph metadata was not available for ${entry.module.name}@${selected}`,
            },
          });
          continue;
        }

        for (const specifier of wrangle.jsrDependencies(res.data.graph)) {
          const from = wrangle.specifierKey(specifier);
          if (!from || !nodeKeys.has(from)) continue;
          const edge: t.EsmTopologicalInput['edges'][number] = { from, to: node.key };
          edges.set(`${edge.from}->${edge.to}`, edge);
        }
        continue;
      }

      unresolved.push({
        entry,
        reason: {
          code: 'registry:graph',
          message: `Graph derivation is not supported for registry ${entry.module.registry}`,
        },
      });
    }

    return {
      nodes,
      edges: [...edges.values()].sort((a, b) =>
        a.from === b.from ? a.to.localeCompare(b.to) : a.from.localeCompare(b.from)
      ),
      unresolved: unresolved.sort((a, b) => wrangle.key(a.entry).localeCompare(wrangle.key(b.entry))),
    };
  },

  jsrDependencies(graph: t.Registry.Jsr.Fetch.PkgGraph): readonly string[] {
    const specifiers = new Set<string>();
    for (const module of graph.modules) {
      for (const dep of module.dependencies) {
        if (!dep.specifier.startsWith('jsr:') && !dep.specifier.startsWith('npm:')) continue;
        specifiers.add(dep.specifier);
      }
    }
    return [...specifiers].sort((a, b) => a.localeCompare(b));
  },

  specifierKey(specifier: string): string | undefined {
    try {
      const module = Esm.parse(specifier);
      return `${module.registry}:${module.name}`;
    } catch {
      return undefined;
    }
  },

  key(entry: t.EsmDeps.Entry): string {
    return `${entry.module.registry}:${entry.module.name}`;
  },

  npmEntry(
    entry: t.EsmDeps.Entry,
  ): t.EsmDeps.Entry & { module: t.EsmDeps.Entry['module'] & { registry: 'npm' } } {
    return entry as t.EsmDeps.Entry & { module: t.EsmDeps.Entry['module'] & { registry: 'npm' } };
  },

  jsrEntry(
    entry: t.EsmDeps.Entry,
  ): t.EsmDeps.Entry & { module: t.EsmDeps.Entry['module'] & { registry: 'jsr' } } {
    return entry as t.EsmDeps.Entry & { module: t.EsmDeps.Entry['module'] & { registry: 'jsr' } };
  },

  totals(
    collected: t.WorkspaceUpgrade.CollectResult,
    policy: t.EsmPolicyResult,
    topological: t.EsmTopologicalResult,
  ): t.WorkspaceUpgrade.SummaryTotals {
    return {
      dependencies: collected.totals.dependencies,
      allowed: policy.decisions.filter((decision) => decision.ok).length,
      blocked: policy.decisions.filter((decision) => !decision.ok).length,
      planned: topological.ok ? topological.items.length : 0,
    };
  },
} as const;
