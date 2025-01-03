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
  const { inDir = '' } = args;
  const source = Path.join(inDir);
  const target = Path.join(inDir, PATHS.backup);
  const ignore = Ignore.create(IGNORE);
  const excluded: t.StringPath[] = [];

  const filter: t.FsCopyFilter = (e) => {
    const path = Path.relative(inDir, e.source);
    const isIgnored = ignore.isIgnored(path);
    if (isIgnored) excluded.push(path);
    return !isIgnored;
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
  const res: t.VitePressBackupResponse = { excluded, snapshot };
  return res;
};
