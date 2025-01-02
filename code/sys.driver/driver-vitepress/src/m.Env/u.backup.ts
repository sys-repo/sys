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
  const viteCacheDir = Path.join(inDir, PATHS.viteCache);
  const distDir = Path.join(inDir, PATHS.dist);

  console.group('🌳 BACKUP: dirs (exclude)');
  console.log('backupDir', backupDir);
  console.log('viteCacheDir', viteCacheDir);
  console.log('distDir', distDir);
  console.groupEnd();


  const filter: t.FsCopyFilter = (e) => {
    const startsWith = (path: string) => e.source.startsWith(path);

    console.log('e.path', e.source);
    console.log('backupDir', startsWith(backupDir));
    console.log('backupDir', startsWith(viteCacheDir));
    console.log('backupDir', startsWith(distDir));
    console.log();

    if (startsWith(backupDir)) return false;
    if (startsWith(viteCacheDir)) return false;
    if (startsWith(distDir)) return false;
    return true;
  };

  // Copy directory snapshot.
  const spinner = Cli.spinner('').start();
  const snapshot = await Dir.snapshot({ source, target, filter });
  spinner.stop().clear();

  // Log output.
  if (!args.silent) {
    await Log.Snapshot.log(snapshot);
    console.info();
  }

  // Response.
  return {
    gitignore,
    snapshot,
  };
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
