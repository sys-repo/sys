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


  const copyRes = await Fs.copyDir(path.source, path.target, { filter });
  if (copyRes.error) errors.push(copyRes.error);

  const res: t.DirSnapshot = {
    id,
    timestamp,
    path,
    files: await wrangle.relativePaths(path.target),
    error: errors.toError(),
  };
  return res;
};

/**
 * Helpers
 */
const wrangle = {
  async relativePaths(dir: t.StringDir) {
    dir = Fs.resolve(dir);
    return (await Fs.ls(dir)).map((path) => path.slice(dir.length + 1));
  },
} as const;
