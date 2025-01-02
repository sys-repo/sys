import { type t, Err, Fs, Path, Time, slug } from './common.ts';

/**
 * Create a snapshot of the specified directory.
 */
export const snapshot: t.FsDirLib['snapshot'] = async (args) => {
  const { filter } = args;
  const errors = Err.errors();
  const timestamp = Time.now.timestamp;
  const id = `${timestamp}.${slug()}`;

  const path: t.DirSnapshot['path'] = {
    source: args.source,
    target: Path.join(args.target, `snapshot.${id}`),
  };

  const copied = await Fs.copyDir(path.source, path.target, { filter });
  if (copied.error) errors.push(copied.error);

  const res: t.DirSnapshot = {
    id,
    timestamp,
    path,
    copied: await Fs.ls(path.target),
    error: errors.toError(),
  };
  return res;
};
