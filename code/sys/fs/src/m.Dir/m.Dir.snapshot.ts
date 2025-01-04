import { DirHash } from '../m.Dir.Hash/mod.ts';
import { type t, Err, Fs, Path, Time, c, stripAnsi } from './common.ts';

/**
 * Create a snapshot of the specified directory.
 */
export const snapshot: t.FsDirLib['snapshot'] = async (args) => {
  const errors = Err.errors();
  const timestamp = Time.now.timestamp;

  const sourceHx = await wrangle.hash(args.source, args.filter);
  const id = `${timestamp}.#${sourceHx.digest.slice(-5)}`;

  const path: t.DirSnapshot['path'] = {
    source: args.source,
    target: Path.join(args.target, `snapshot.${id}`),
  };

  const filter: t.FsCopyFilter = (e) => (args.filter ? args.filter(e.source) : true);
  const copyRes = await Fs.copyDir(path.source, path.target, { filter });
  if (copyRes.error) errors.push(copyRes.error);

  const targetHx = await wrangle.hash(path.target);
  if (sourceHx.digest !== targetHx.digest) {
    let msg = c.yellow(c.bold('WARNING'));
    msg += ` Snapshot hashes differ between source and target (after [copy] operation).\n`;
    msg += ` source ${c.yellow(sourceHx.digest)}\n`;
    msg += `        ${c.gray(args.source)}\n`;
    msg += ` target ${c.yellow(targetHx.digest)}\n`;
    msg += `        ${c.gray(path.target)}\n`;

    console.info();
    console.info(msg);
    errors.push(stripAnsi(msg));
  }

  const res: t.DirSnapshot = {
    id,
    timestamp,
    path,
    hx: targetHx,
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
