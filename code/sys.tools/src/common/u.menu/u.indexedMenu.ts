import { type t, Time } from './common.ts';
import { promptDirsMenu } from '../u.prompt/mod.ts';

/** Result */
type IndexedMenuResult =
  | { readonly kind: 'exit' }
  | { readonly kind: 'selected'; readonly key: string };

/**
 * Stateful indexed menu over a persisted, scoped list.
 *
 * Handles selection, optional creation, and recency updates in config.
 */
export async function indexedMenu<TDoc extends t.JsonFileDoc, TScope, TEntry>(args: {
  scope: TScope;
  config: t.JsonFile<TDoc>;

  adapter: {
    list(doc: TDoc, scope: TScope): readonly TEntry[];
    set(doc: TDoc, scope: TScope, next: readonly TEntry[]): void;

    keyOf(entry: TEntry): string;
    labelOf(entry: TEntry): string;

    lastUsedAtOf(entry: TEntry): t.UnixTimestamp | undefined;
    withLastUsedAt(entry: TEntry, ts: t.UnixTimestamp): TEntry;

    add?: (args: { readonly scope: TScope; readonly config: t.JsonFile<TDoc> }) => Promise<void>;
  };

  ui: {
    message: string;
    prefix: string;
    addLabel?: string;
  };
}): Promise<IndexedMenuResult> {
  const { scope, config, adapter, ui } = args;

  const orderByRecency = (items: readonly TEntry[]) =>
    [...items].sort((a, b) => (adapter.lastUsedAtOf(b) ?? 0) - (adapter.lastUsedAtOf(a) ?? 0));

  while (true) {
    const current = orderByRecency(adapter.list(config.current, scope));

    const dirs = current.map((e) => ({
      name: adapter.labelOf(e),
      dir: adapter.keyOf(e) as t.StringDir,
    }));

    const picked = await promptDirsMenu<string>({
      message: ui.message,
      prefix: ui.prefix,
      dirs,
      cmdAdd: adapter.add ? 'add' : 'exit',
      cmdExit: 'exit',
      addLabel: ui.addLabel ?? ' add',
      paintName: (s) => s,
    });

    if (picked === 'exit') return { kind: 'exit' };

    if (picked === 'add') {
      if (adapter.add) await adapter.add({ scope, config });
      continue;
    }

    config.change((doc) => {
      const now = Time.now.timestamp;
      const next = adapter
        .list(doc, scope)
        .map((e) => (adapter.keyOf(e) === picked ? adapter.withLastUsedAt(e, now) : e));
      adapter.set(doc, scope, next);
    });

    await config.fs.save();
    return { kind: 'selected', key: picked };
  }
}
