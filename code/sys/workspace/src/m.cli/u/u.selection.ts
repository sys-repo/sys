import { Arr, Deps, Err, type t } from '../common.ts';

type Entry = t.EsmDeps.Entry;

/** CLI-only translation of name/alias selectors into the existing policy exclusions. */
export const UpgradeSelection = {
  async entries(input: t.WorkspaceUpgrade.Input): Promise<readonly Entry[]> {
    const manifest = await Deps.from(input.deps);
    if (!manifest.data) {
      throw Err.std('Workspace dependency manifest data could not be retrieved', {
        cause: manifest.error,
      });
    }
    return manifest.data.entries;
  },

  async nonInteractive(
    input: t.WorkspaceUpgrade.Input,
    options: t.WorkspaceCli.ResolvedOptions,
  ): Promise<t.WorkspaceCli.Selection> {
    if (options.include.length === 0) return { include: [], exclude: options.exclude };
    const entries = await UpgradeSelection.entries(input);
    return {
      include: options.include,
      exclude: UpgradeSelection.exclusions(entries, options.include, options.exclude),
    };
  },

  async interactive(input: t.WorkspaceUpgrade.Input): Promise<readonly Entry[]> {
    const entries = await UpgradeSelection.entries(input);
    for (const entry of entries) {
      const token = entry.module.name;
      const matches = entries.filter((other) => wrangle.matches(other, token));
      if (matches.length > 1) throw wrangle.conflict(token, matches);
    }
    return entries;
  },

  exclusions(
    entries: readonly Entry[],
    include: readonly string[],
    exclude: readonly string[],
  ): readonly string[] {
    const included = entries.filter((entry) =>
      include.some((token) => wrangle.matches(entry, token))
    );
    const generated = entries.filter((entry) => !included.includes(entry));
    for (const source of generated) {
      const token = source.module.name;
      const conflict = included.find((entry) =>
        wrangle.matches(entry, token) && !exclude.some((token) => wrangle.matches(entry, token))
      );
      if (conflict) throw wrangle.conflict(token, [source, conflict]);
    }
    return Arr.uniq([...exclude, ...generated.map((entry) => entry.module.name)]).toSorted();
  },
} as const;

const wrangle = {
  matches(entry: Entry, token: string): boolean {
    return entry.module.name === token || (!!entry.module.alias && entry.module.alias === token);
  },

  conflict(token: string, entries: readonly Entry[]): t.StdError {
    const names = entries.map(({ module: m }) =>
      `${m.registry}:${m.name} (alias: ${m.alias ?? '(none)'})`
    );
    return Err.std(
      `Ambiguous workspace CLI selector "${token}": ${
        names.join(', ')
      }. The existing name-based selection cannot preserve these choices.`,
    );
  },
} as const;
