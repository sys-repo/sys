import { type t, Esm, Jsr, Npm } from './common.ts';
import { collect } from './u.collect.ts';

export const upgrade: t.WorkspaceUpgrade.Lib['upgrade'] = async (input, options) => {
  const collected = await collect(input, options);
  collected.options.progress?.({ kind: 'plan' });
  const policy = Esm.Policy.decideAll(collected.candidates.map(wrangle.policyInput(collected.options)));
  const graph = await wrangle.graph(policy);
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
};

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

  async graph(policy: t.EsmPolicyResult): Promise<t.WorkspaceUpgrade.Graph> {
    const nodes = policy.decisions
      .filter((decision): decision is t.EsmPolicyDecision & { ok: true } => decision.ok)
      .map((decision) => ({
        key: wrangle.key(decision.input.subject.entry),
        decision,
      }));

    const nodeKeys = new Set(nodes.map((node) => node.key));
    const edges = new Map<string, t.EsmTopologicalInput['edges'][number]>();
    const unresolved: t.WorkspaceUpgrade.GraphUnresolved[] = [];

    for (const node of nodes) {
      const entry = node.decision.input.subject.entry;
      const selected = node.decision.selection.selected?.version;
      if (!selected) continue;

      if (entry.module.registry === 'npm') {
        const res = await wrangle.npmInfo(entry, selected);
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
        const res = await wrangle.jsrInfo(entry, selected);
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

  npmInfo(entry: t.EsmDeps.Entry, version: t.StringSemver) {
    return wrangle.isNpm(entry) ? wrangle.fetchNpmInfo(entry, version) : Promise.resolve(undefined as never);
  },

  jsrInfo(entry: t.EsmDeps.Entry, version: t.StringSemver) {
    return wrangle.isJsr(entry) ? wrangle.fetchJsrInfo(entry, version) : Promise.resolve(undefined as never);
  },

  isNpm(entry: t.EsmDeps.Entry): entry is t.EsmDeps.Entry & { module: t.EsmDeps.Entry['module'] & { registry: 'npm' } } {
    return entry.module.registry === 'npm';
  },

  isJsr(entry: t.EsmDeps.Entry): entry is t.EsmDeps.Entry & { module: t.EsmDeps.Entry['module'] & { registry: 'jsr' } } {
    return entry.module.registry === 'jsr';
  },

  fetchNpmInfo(entry: t.EsmDeps.Entry & { module: t.EsmDeps.Entry['module'] & { registry: 'npm' } }, version: t.StringSemver) {
    return Npm.Fetch.Pkg.info(entry.module.name, version);
  },

  fetchJsrInfo(entry: t.EsmDeps.Entry & { module: t.EsmDeps.Entry['module'] & { registry: 'jsr' } }, version: t.StringSemver) {
    return Jsr.Fetch.Pkg.info(entry.module.name, version);
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
