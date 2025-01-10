import { type t, Delete, DirHash, Err, Fs, NAME, Path, Time, c, stripAnsi } from './common.ts';

type F = t.FsDirSnapshotLib['write'];

const join = Path.join;

/**
 * Write a snapshot of the specified directory to disk.
 */
export const write: F = async (args) => {
  const { force = false, message } = args;
  const errors = Err.errors();
  const timestamp = Time.now.timestamp;

  const sourceHx = await wrangle.hash(args.source, args.filter);
  let hx = sourceHx;

  const id = `${timestamp}.${wrangle.short(sourceHx.digest)}`;
  let path = wrangle.paths(id, args.source, args.target);
  let backref = false;

  /**
   * Check for existing shapshot.
   */
  if (!force) {
    const existing = await wrangle.existing(path, sourceHx.digest);
    if (existing) {
      const backrefPaths = wrangle.paths(id, args.source, args.target, existing);
      await writeMeta(backrefPaths.target.meta, sourceHx, true, message);
      backref = true;
      path = backrefPaths;
    }
  }

  /**
   * Copy
   */
  if (!backref) {
    const filter: t.FsCopyFilter = (e) => (args.filter ? args.filter(e.source) : true);
    const copyRes = await Fs.copyDir(path.source, path.target.files, { filter });
    if (copyRes.error) errors.push(copyRes.error);

    /**
     * Post copy response.
     */
    const targetHx = await wrangle.hash(path.target.files);
    if (sourceHx.digest !== targetHx.digest) {
      let msg = c.yellow(c.bold('WARNING'));
      msg += ` Snapshot hashes differ between source and target (after [copy] operation).\n`;
      msg += ` source ${c.yellow(sourceHx.digest)}\n`;
      msg += `        ${c.gray(args.source)}\n`;
      msg += ` target ${c.yellow(targetHx.digest)}\n`;
      msg += `        ${c.gray(path.target.root)}\n`;
      console.info();
      console.info(msg);
      errors.push(stripAnsi(msg));
      if (args.throw) throw new Error(msg);
    }

    hx = targetHx;
    await writeMeta(path.target.meta, targetHx, false, message);
  }

  const res: t.DirSnapshot = {
    id,
    timestamp,
    hx,
    path,
    is: { ref: backref },
    error: errors.toError(),
  };
  return res;
};

/**
 * Helpers
 */
const writeMeta = async (
  path: t.StringPath,
  hx: t.CompositeHash,
  isRef: boolean,
  message?: string,
) => {
  const meta: t.DirSnapshotMeta = { hx };
  if (isRef) meta.ref = true;
  if ((message || '').trim()) meta.message = message;
  await Fs.writeJson(path, meta);
};

const wrangle = {
  async hash(dir: t.StringDir, filter?: t.FsPathFilter) {
    const hx = await DirHash.compute(dir, { filter });
    return hx.hash;
  },

  short(digest: t.StringHash) {
    return digest.slice(-5) || '0'.repeat(5);
  },

  paths(
    id: string,
    source: t.StringPath,
    target: t.StringPath,
    backref?: t.StringAbsoluteDir,
  ): t.DirSnapshotPaths {
    let root = Path.resolve(target, `${NAME.prefix}.${id}`);
    if (backref) root += NAME.ext.backref;
    return {
      source: Path.resolve(source),
      target: {
        root,
        meta: join(root, NAME.meta),
        files: join(backref ?? root, NAME.dir),
      },
    };
  },

  async existing(path: t.DirSnapshotPaths, digest: t.StringHash) {
    const hx = wrangle.short(digest);
    const dir = Path.dirname(path.target.root);
    if (!(await Fs.exists(dir))) return;

    const isHashDirname = (name: string) => {
      return name.startsWith('snapshot.') && name.endsWith(`.${hx}`);
    };

    const isHashDir = async (dir: t.StringAbsoluteDir) => {
      const json = await Fs.readJson<t.DirSnapshotMeta>(join(dir, NAME.meta));
      if (!json.exists) return false;
      if (typeof json.data?.hx !== 'object') return false;
      return json.data.hx.digest === digest;
    };

    for await (const entry of Deno.readDir(dir)) {
      if (entry.isFile) continue;
      if (!isHashDirname(entry.name)) continue;
      if (await isHashDir(join(dir, entry.name))) return join(dir, entry.name); // 🌳 Existing snapshot match!
    }

    return; // No match.
  },
} as const;
