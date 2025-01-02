import { type t, Cli, Dir, Fs, Ignore, Log, Path, PATHS } from './common.ts';

/**
 * Create a backup snapshot.
 */
export const backup: t.VitePressEnvLib['backup'] = async (args) => {
  const { inDir = '' } = args;

  const source = Path.join(inDir);
  const target = Path.join(inDir, PATHS.backup);

  const gitignore = await wrangle.gitignore(source);
  const backupDir = Path.join(inDir, PATHS.backup);


  const filter: t.FsCopyFilter = (e) => {
    if (e.source.startsWith(backupDir)) return false;
    if (gitignore?.isIgnored(e.source)) return false;
    return true;
  };

  // Copy directory snapshot.
  const spinner = Cli.spinner('').start();
  const snapshot = await Dir.snapshot({ source, target, filter });
  spinner.stop().clear();

  // Finish up.
  if (!options.silent) {
    await Log.Snapshot.log(snapshot);
    console.info();
  }
  return { gitignore, snapshot };
};

/**
 * Helpers
 */
const wrangle = {
  async gitignore(dir: t.StringDir) {
    const path = Path.join(dir, '.gitignore');
    return (await Fs.exists(path)) ? Ignore.create(await Deno.readTextFile(path)) : undefined;
  },
} as const;
