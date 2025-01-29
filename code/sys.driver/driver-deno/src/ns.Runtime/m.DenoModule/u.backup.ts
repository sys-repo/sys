import { type t, Cli, Dir, Ignore, PATHS, Path } from './common.ts';

export const backup: t.DenoModuleLib['backup'] = async (args) => {
  const { force = false, message, fmt = {}, includeDist = false } = args;
  const source = Path.resolve(args.source ?? '.');
  const target = args.target ? Path.resolve(args.target) : Path.join(source, PATHS.backup);
  const ignore = Ignore.create(args.ignore ?? '');

  const filter: t.FsPathFilter = (absolute) => {
    if (absolute.startsWith(target)) return false; // NB: ensure we don't "backup the backup."

    const relative = absolute.startsWith(source) ? absolute.slice(source.length + 1) : absolute;
    if (relative.startsWith(PATHS.dist) && includeDist === false) return false;
    if (ignore.isIgnored(relative)) return false;
    if (args.filter?.(absolute) === false) return false;

    return true;
  };

  // Copy the snapshot.
  const spinner = Cli.spinner('').start();
  const snapshot = await Dir.snapshot({ source, target, filter, force, message });
  spinner.stop().clear();

  // Log output.
  if (!args.silent) {
    const title = fmt.title;
    await Dir.Snapshot.Fmt.log(snapshot, { title, message });
  }

  // Response.
  const res: t.DenoModuleBackupResponse = { snapshot };
  return res;
};
