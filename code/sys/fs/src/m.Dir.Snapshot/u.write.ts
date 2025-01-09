import { type t, DirHash, Err, Fs, Path, Time, c, stripAnsi } from './common.ts';

type F = t.FsDirSnapshotLib['write'];

/**
 * Write a snapshot of the specified directory to disk.
 */
export const write: F = async (args) => {
  const errors = Err.errors();
  const timestamp = Time.now.timestamp;

  const sourceHx = await wrangle.hash(args.source, args.filter);
  const id = `${timestamp}.${sourceHx.digest.slice(-5)}`;

  const root = Path.join(args.target, `snapshot.${id}`);
  const path: t.DirSnapshotPaths = {
    source: args.source,
    target: {
      root,
      files: Path.join(root, 'dir'),
      meta: Path.join(root, 'dir.json'),
    },
  };

  const filter: t.FsCopyFilter = (e) => (args.filter ? args.filter(e.source) : true);

  const copyRes = await Fs.copyDir(path.source, path.target.files, { filter });
  if (copyRes.error) errors.push(copyRes.error);

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

  const hx = targetHx;
  const meta: t.DirSnapshotMeta = { hx };
  await Fs.writeJson(path.target.meta, meta);

  const res: t.DirSnapshot = {
    id,
    timestamp,
    path,
    hx,
    error: errors.toError(),
  };
  return res;
};

/**
 * Helpers
 */
const wrangle = {
  async hash(dir: t.StringDir, filter?: t.FsPathFilter) {
    const hx = await DirHash.compute(dir, { filter });
    return hx.hash;
  },
} as const;
