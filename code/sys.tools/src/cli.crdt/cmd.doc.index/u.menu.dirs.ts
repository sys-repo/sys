import { type t, dirIndexMenu } from '../common.ts';

export async function dirsMenu(args: {
  config: t.CrdtTool.Config.File;
  cwd: t.StringDir;
  docid: t.Crdt.Id;
  defaultMount?: string;
}) {
  const { config, cwd, docid, defaultMount = 'fs:index' } = args;
  return await dirIndexMenu({
    cwd,
    scopeKey: docid,
    defaultMount,
    config,
    ui: { message: 'Indexes:\n' },
    io: {
      list(doc, scope: t.Crdt.Id) {
        const hit = (doc.docs ?? []).find((d) => d.id === scope);
        return hit?.indexes?.['fs:dirs']?.dirs ?? [];
      },

      set(doc, scope: t.Crdt.Id, next) {
        const hit = (doc.docs ?? []).find((d) => d.id === scope);
        if (!hit) return;

        const indexes = (hit.indexes ??= {});
        const fsdirs = (indexes['fs:dirs'] ??= {});
        fsdirs.dirs = [...next];
      },

      keyOf(e: t.CrdtTool.Config.DirIndexEntry): string {
        const m = e.mount ?? [];
        return m.length > 0 ? m.join('/') : defaultMount;
      },

      mountOf(e: t.CrdtTool.Config.DirIndexEntry) {
        const m = e.mount ?? [];
        return m.length > 0 ? m : undefined;
      },

      subdirOf(e: t.CrdtTool.Config.DirIndexEntry) {
        return e.subdir ?? '.';
      },

      lastUsedAtOf(e: t.CrdtTool.Config.DirIndexEntry) {
        return e.lastUsedAt;
      },

      withLastUsedAt(
        e: t.CrdtTool.Config.DirIndexEntry,
        ts: t.UnixTimestamp,
      ): t.CrdtTool.Config.DirIndexEntry {
        return { ...e, lastUsedAt: ts };
      },

      create(input): t.CrdtTool.Config.DirIndexEntry {
        return {
          subdir: input.subdir,
          mount: input.mount,
          createdAt: input.createdAt,
          lastUsedAt: input.lastUsedAt,
        };
      },
    },
  });
}
