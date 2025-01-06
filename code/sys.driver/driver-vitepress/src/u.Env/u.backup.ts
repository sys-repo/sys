import { type t, Cli, Dir, Ignore, Log, Path, PATHS } from './common.ts';

const IGNORE = `
node_modules/
dist/
-backup/
-backup/**
.vitepress/cache/
.tmp/
`;

/**
 * Create a backup snapshot.
 */
export const backup: t.VitePressEnvLib['backup'] = async (args) => {
  const inDir = Path.resolve(args.inDir);

  const source = Path.join(inDir);
  const target = Path.join(inDir, PATHS.backup);
  const ignore = Ignore.create(IGNORE);

  const filter: t.FsPathFilter = (p) => {
    p = p.startsWith(inDir) ? p.slice(inDir.length + 1) : p;

    if (p.startsWith(PATHS.backup)) return false;
    if (p.startsWith(PATHS.vitepressCache)) return false;
    if (p.startsWith(PATHS.dist)) return !!args.includeDist;

    if (ignore.isIgnored(p)) return false;
    return true;
  };

  // Copy directory snapshot.
  const spinner = Cli.spinner('').start();
  const snapshot = await Dir.snapshot({ source, target, filter });
  spinner.stop().clear();

  // Log output.
  if (!args.silent) {
    console.info();
    await Log.Snapshot.log(snapshot);
    console.info();
  }

  // Response.
  const res: t.VitePressBackupResponse = { snapshot };
  return res;
};
