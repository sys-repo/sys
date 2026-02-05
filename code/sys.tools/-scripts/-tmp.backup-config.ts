import { type t, c, Fmt, Fs, Is } from '../src/common.ts';

export async function backupConfig(args: {
  from: t.StringPath;
  to: t.StringPath;
  dryRun?: boolean;
  snapshot?: boolean;
  merge?: boolean;
}) {
  const { dryRun = false, snapshot = true, merge = false } = args;

  console.info();
  console.info(c.bold(c.cyan('Backup Config')));

  const from = args.from;
  const to = args.to;

  const cwd = Fs.cwd('terminal');
  const fromPath = Fs.Path.resolve(cwd, Fs.Tilde.expand(from));
  const toRoot = Fs.Path.resolve(cwd, Fs.Tilde.expand(to));
  const toRootExists = await Fs.exists(toRoot);
  const toRootIsDir = toRootExists ? await Fs.Is.dir(toRoot) : false;

  let toPath = toRoot;
  if (snapshot) {
    const existing = toRootIsDir ? await Fs.ls(toRoot, { includeDirs: true }) : [];
    let maxIndex = -1;
    for (const entry of existing) {
      const name = Fs.basename(entry);
      const match = name.match(/^-config\.(\d{3})$/);
      if (!match) continue;
      if (!(await Fs.Is.dir(entry))) continue;
      const value = Number(match[1]);
      if (!Is.number(value) || Number.isNaN(value)) continue;
      if (value > maxIndex) maxIndex = value;
    }

    const nextIndex = maxIndex + 1;
    const suffix = String(nextIndex).padStart(3, '0');
    toPath = Fs.join(toRoot, `-config.${suffix}`);
  }

  const fromExists = await Fs.exists(fromPath);
  const fromIsDir = fromExists ? await Fs.Is.dir(fromPath) : false;
  const toPathExists = await Fs.exists(toPath);
  const toPathIsDir = toPathExists ? await Fs.Is.dir(toPath) : false;

  const Log = {
    path(label: string, path: string, exists: boolean) {
      console.info(
        c.gray(`  ${label} `),
        Fmt.prettyPath(Fs.trimCwd(path)),
        c.dim(`[existed=${exists}]`),
      );
    },
  };

  console.info(c.gray('  dry-run:'), c.cyan(String(dryRun)));
  Log.path('from:   ', fromPath, fromExists);
  Log.path('to-root:', toRoot, toRootExists);
  Log.path('to-target:', toPath, toPathExists);
  console.info();

  if (!fromExists || !fromIsDir) {
    console.info(c.yellow('from path is missing or not a directory'));
    return;
  }

  if (toPathExists) {
    if (!merge) {
      const note = toPathIsDir ? 'directory already exists' : 'path already exists';
      console.info(c.yellow(`target ${note}`));
      return;
    }
    if (!toPathIsDir) {
      console.info(c.yellow(`target path exists and is not a directory`));
      return;
    }
  }

  if (dryRun) return;

  if (!toRootExists) await Fs.ensureDir(toRoot);
  const res = await Fs.copy(fromPath, toPath, { log: true, force: merge, throw: true });
  if (res.error) console.info(c.yellow(`backup failed: ${res.error.message}`));
}
