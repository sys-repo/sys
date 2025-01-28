import { type t, Cli, Dir, Ignore, PATHS, Path } from './common.ts';

export const IGNORE = `
node_modules/
dist/
-backup/
-backup/**
.tmp/
`;

export const backup: t.DenoModuleLib['backup'] = async (args) => {
  const { force = false, message, fmt = {} } = args;

  const source = Path.resolve(args.source ?? '.');
  const target = args.target ? Path.resolve(args.target) : Path.join(source, PATHS.backup);
  const ignore = Ignore.create(`${IGNORE}\n${args.ignore ?? ''}`);

  const filter: t.FsPathFilter = (p) => {
    p = p.startsWith(source) ? p.slice(source.length + 1) : p;

    if (p.startsWith(PATHS.backup)) return false;
    if (p.startsWith(PATHS.dist)) return !!args.includeDist;
    if (ignore.isIgnored(p)) return false;
    if (args.filter?.(p) === false) return false;

    return true;
  };

  // Copy the snapshot.
  const spinner = Cli.spinner('').start();
  const snapshot = await Dir.snapshot({ source, target, filter, force, message });
  spinner.stop().clear();

  // Log output.
  if (!args.silent) {
    const title = fmt.title;
    await Dir.Snapshot.Fmt.log(snapshot, { title });
  }

  // Response.
  const res: t.DenoModuleBackupResponse = { snapshot };
  return res;
};
