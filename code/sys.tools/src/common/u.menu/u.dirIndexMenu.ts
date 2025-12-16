import { type t, c, Cli, Fs, Obj, Str, Time } from './common.ts';
import { indexedMenu } from './u.indexedMenu.ts';

/** Result */
type DirIndexMenuResult =
  | { readonly kind: 'exit' }
  | {
      readonly kind: 'selected';
      readonly mount: t.ObjectPath;
      readonly mountKey: string;
      readonly subdir: string;
      readonly dir: t.StringDir;
    };

/**
 * Interactive directory index menu backed by a scoped config list.
 *
 * Lets the user pick a remembered entry, or add a new directory + mount path.
 * Updates "last used" metadata and persists changes to the config.
 */
export async function dirIndexMenu<TDoc extends t.JsonFileDoc, TEntry>(args: {
  cwd: t.StringDir;
  scopeKey: string;
  defaultMount: string;
  config: t.JsonFile<TDoc>;
  io: {
    list(doc: TDoc, scope: string): readonly TEntry[];
    set(doc: TDoc, scope: string, next: readonly TEntry[]): void;

    keyOf(e: TEntry): string;
    mountOf(e: TEntry): t.ObjectPath | undefined;
    subdirOf(e: TEntry): string | undefined;
    lastUsedAtOf(e: TEntry): t.UnixTimestamp | undefined;
    withLastUsedAt(e: TEntry, ts: t.UnixTimestamp): TEntry;

    create(input: {
      mount: t.ObjectPath;
      subdir: string;
      createdAt: t.UnixTimestamp;
      lastUsedAt: t.UnixTimestamp;
    }): TEntry;
  };

  ui?: {
    message?: string;
    prefix?: string;
    addLabel?: string;
  };
}): Promise<DirIndexMenuResult> {
  const { cwd, scopeKey, defaultMount, config, io, ui } = args;

  const parseSubdir = (raw: string): t.StringDir => {
    const v = raw.trim();
    if (!v || v === '.') return '.';
    return Str.trimSlashes(v);
  };

  const resolveDir = (subdir: string): t.StringDir => (subdir === '.' ? cwd : Fs.join(cwd, subdir));

  const picked = await indexedMenu({
    scope: scopeKey,
    config,
    adapter: {
      list: io.list,
      set: io.set,
      keyOf: io.keyOf,
      labelOf(e) {
        const sub = io.subdirOf(e) ?? '.';
        const path = sub === '.' ? './' : `./${sub}`;
        return `${io.keyOf(e)}  ${c.gray(path)}`;
      },
      lastUsedAtOf: io.lastUsedAtOf,
      withLastUsedAt: io.withLastUsedAt,

      async add({ scope, config }) {
        const subdirInput = await Cli.Input.Text.prompt({
          message: 'Directory',
          hint: 'Enter for current',
        });

        const subdir = parseSubdir(subdirInput);
        const abs = resolveDir(subdir);

        const stat = await Fs.stat(abs);
        if (!stat || !stat.isDirectory) return;

        let mount: t.ObjectPath | undefined;

        while (!mount) {
          const m = await Cli.Input.Text.prompt({
            message: 'Mount path',
            default: defaultMount,
          });

          const res = Obj.Path.tryDecode(m.startsWith('/') ? m : `/${m}`, {
            codec: 'pointer',
            safe: true,
            numeric: false,
          });

          if (res.path.length > 0) mount = res.path;
        }

        config.change((doc) => {
          const now = Time.now.timestamp;
          const next = [
            ...io.list(doc, scope),
            io.create({
              mount,
              subdir,
              createdAt: now,
              lastUsedAt: now,
            }),
          ];
          io.set(doc, scope, next);
        });

        await config.fs.save();
      },
    },

    ui: {
      message: ui?.message ?? 'Dirs:\n',
      prefix: ui?.prefix ?? 'dir:',
      addLabel: ui?.addLabel ?? ' add: <dir>',
    },
  });

  if (picked.kind === 'exit') return { kind: 'exit' };

  const entry = io.list(config.current, scopeKey).find((e) => io.keyOf(e) === picked.key);
  const mount = io.mountOf(entry as TEntry) ?? [];
  const mountKey = mount.length > 0 ? mount.join('/') : defaultMount;
  const subdir = io.subdirOf(entry as TEntry) ?? '.';

  return {
    kind: 'selected',
    mount,
    mountKey,
    subdir,
    dir: resolveDir(subdir),
  };
}
