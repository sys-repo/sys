import { type t, DenoDeps, Deps, Err, Esm, Fs, Path } from './common.ts';
import { upgrade } from './u.upgrade.ts';

export const apply: t.WorkspaceUpgrade.Lib['apply'] = async (input, options) => {
  const planned = await upgrade(input, options);
  if (!planned.topological.ok) throw wrangle.topologyError(planned.topological);

  const manifest = await Deps.from(planned.input.deps);
  if (!manifest.data) {
    throw Err.std('Workspace dependency manifest data could not be retrieved', {
      cause: manifest.error,
    });
  }

  const entries = wrangle.entries(manifest.data.entries, planned.policy);
  const files = await DenoDeps.applyFiles(
    {
      depsPath: planned.input.deps,
      denoFilePath: wrangle.denoFilePath(planned.input),
    },
    [...entries],
  );

  return {
    input: planned.input,
    options: planned.options,
    upgrade: planned,
    entries,
    files,
  };
};

const wrangle = {
  denoFilePath(input: t.WorkspaceUpgrade.Input): t.StringPath {
    const dir = input.cwd ?? Fs.dirname(input.deps);
    return Path.resolve(dir, 'deno.json');
  },

  entries(
    entries: readonly t.EsmDeps.Entry[],
    policy: t.EsmPolicyResult,
  ): readonly t.EsmDeps.Entry[] {
    const selectedByKey = new Map(
      policy.decisions
        .filter((decision): decision is t.EsmPolicyDecision & { ok: true } => decision.ok)
        .flatMap((decision) => {
          const version = decision.selection.selected?.version;
          return version ? [[wrangle.key(decision.input.subject.entry), version] as const] : [];
        }),
    );

    return entries.map((entry) => {
      const version = selectedByKey.get(wrangle.key(entry));
      if (!version) return entry;
      const input = Esm.toString(entry.module, { version });
      const module = Esm.parse(input, entry.module.alias);
      return { ...entry, module };
    });
  },

  key(entry: t.EsmDeps.Entry): string {
    return `${entry.module.registry}:${entry.module.name}`;
  },

  topologyError(result: Exclude<t.EsmTopologicalResult, { ok: true }>): t.StdError {
    if ('cycle' in result) {
      const err = `Workspace upgrade plan could not be applied because the dependency graph is cyclic: ${result.cycle.keys.join(', ')}`;
      return Err.std(err);
    }

    const err = `Workspace upgrade plan could not be applied because the dependency graph is invalid: ${result.invalid.code}`;
    return Err.std(err);
  },
} as const;
