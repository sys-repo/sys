import { Config } from '../u.config/mod.ts';
import { promptDirsMenu } from '../u.prompt/mod.ts';
import { type t, Time } from './common.ts';

type Result = { readonly kind: 'exit' } | { readonly kind: 'selected'; readonly key: string };

export async function indexedMenu<
  TDoc extends t.JsonFileDoc,
  TScope,
  TEntry extends t.Tools.Recency,
>(args: {
  scope: TScope;
  config: t.JsonFile<TDoc>;
  adapter: {
    list(doc: TDoc, scope: TScope): readonly TEntry[];
    set(doc: TDoc, scope: TScope, next: readonly TEntry[]): void;

    keyOf(entry: TEntry): string;
    labelOf(entry: TEntry): t.Tools.Prompt.Dirs.MenuLabel;
    lastUsedAtOf(entry: TEntry): t.UnixTimestamp | undefined;
    withLastUsedAt(entry: TEntry, ts: t.UnixTimestamp): TEntry;
    add?: (args: { readonly scope: TScope; readonly config: t.JsonFile<TDoc> }) => Promise<void>;
  };

  ui: {
    message: string;
    prefix: string;
    addLabel?: string;
    paintKey?: (key: string) => string;

    /**
     * Optional renderer for list rows.
     * When provided, the renderer owns row label text and sort key.
     */
    render?: t.Tools.Prompt.Dirs.RenderRow;
  };
}): Promise<Result> {
  const { scope, config, adapter, ui } = args;

  while (true) {
    const current = Config.orderByRecency(adapter.list(config.current, scope));

    const dirs = current.map((e) => ({
      name: adapter.labelOf(e),
      dir: adapter.keyOf(e),
    }));

    const picked = await promptDirsMenu<string>({
      message: ui.message,
      prefix: ui.prefix,
      dirs,
      cmdAdd: adapter.add ? 'add' : 'exit',
      cmdExit: 'exit',
      addLabel: ui.addLabel ?? ' add',
      order: 'preserve', // Preserve canonical ordering:
      paintName: ui.paintKey,
      render: ui.render,
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
