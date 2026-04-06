import { type t, Fs, Ignore, Is, Path } from './common.ts';

type Args = {
  readonly source: t.StringDir;
  readonly root: t.StringDir;
  readonly retain: ReadonlySet<t.StringPath>;
};

type O = Record<string, unknown>;

export async function materializeWorkspace(args: Args): Promise<void> {
  for (const file of await wrangle.rootFiles(args.source)) {
    const source = Fs.join(args.source, file);
    const target = Fs.join(args.root, file);
    const res = await Fs.copy(source, target, { force: true });
    if (res.error) throw res.error;
  }

  for (const dir of args.retain) {
    const source = Fs.join(args.source, dir);
    const target = Fs.join(args.root, dir);
    const res = await Fs.copyDir(source, target, {
      force: true,
      filter: (e) => wrangle.shouldRetain(e.source, source),
    });
    if (res.error) throw res.error;
  }
}

/**
 * Helpers:
 */
const wrangle = {
  ignore: Ignore.create([
    '.DS_Store',
    '.env',
    '**/.tmp/**',
    '**/node_modules/**',
    '**/src/-test/**',
  ]),

  async rootFiles(source: t.StringDir) {
    const files = ['deno.json'] as string[];
    const lock = Fs.join(source, 'deno.lock');
    if (await Fs.exists(lock)) files.push('deno.lock');

    const deno = await Fs.readJson<O>(Fs.join(source, 'deno.json'));
    const importMap =
      deno.ok && deno.data && Is.str(deno.data.importMap) ? deno.data.importMap : undefined;
    if (importMap && importMap.trim().length > 0) {
      const relative = Path.relative(source, Path.resolve(source, importMap));
      files.push(relative.replaceAll('\\', '/'));
    }

    return files;
  },

  shouldRetain(path: t.StringPath, root: t.StringDir) {
    const relative = Path.relative(root, path).replaceAll('\\', '/');
    if (!relative || relative === '.') return true;
    return !wrangle.ignore.isIgnored(relative);
  },
} as const;
