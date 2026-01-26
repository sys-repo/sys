import { type t, c, dirIndexMenu } from '../common.ts';

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

    ui: {
      message: 'Indexes:\n',
      paintKey: c.cyan,
      exitLabel: c.gray(c.dim('← back')),
    },

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

      keyOf(e) {
        const m = e.mount ?? [];
        return m.length > 0 ? m.join('/') : defaultMount;
      },

      mountOf(e) {
        const m = e.mount ?? [];
        return m.length > 0 ? m : undefined;
      },

      subdirOf(e) {
        return e.subdir ?? '.';
      },

      lastUsedAtOf(e) {
        return e.lastUsedAt;
      },

      withLastUsedAt(e, lastUsedAt) {
        return { ...e, lastUsedAt };
      },

      create(input) {
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
