import { SlugTree } from '../slug.SlugTree/mod.ts';

import { type t, c, DEFAULT_IGNORE, Fs, Json } from './common.ts';
import { readLintProfile } from './u.lint.util.ts';

export async function runSlugTreeFs(args: {
  cwd: t.StringDir;
  profilePath: t.StringFile;
  createCrdt: () => Promise<t.StringRef>;
}) {
  const { cwd, profilePath, createCrdt } = args;
  const doc = await readLintProfile(profilePath);
  const config = doc['fs:slug-tree'];
  if (!config) {
    console.info(c.yellow('warning: fs:slug-tree skipped (missing config)'));
    return;
  }

  const source = Fs.Tilde.expand(String(config.source ?? '.'));
  const root = Fs.Path.resolve(cwd, source || '.');

  const targets = normalizeTargets(config.target?.manifest).map((target) => ({
    raw: target,
    path: Fs.Path.resolve(cwd, Fs.Tilde.expand(String(target))),
  }));
  const targetDir = config.target?.dir
    ? Fs.Path.resolve(cwd, Fs.Tilde.expand(String(config.target.dir)))
    : undefined;

  if (targets.length === 0 && !targetDir) {
    console.info(c.yellow('warning: fs:slug-tree skipped (no target configured)'));
    return;
  }

  const include = config.include ? [...config.include] : undefined;
  const ignore = config.ignore ? [...config.ignore] : undefined;

  const tree = await SlugTree.fromDir(
    { root, createCrdt },
    {
      include,
      ignore,
      sort: config.sort,
      readmeAsIndex: config.readmeAsIndex,
    },
  );

  if (targetDir) {
    await copySlugTreeSource({ root, targetDir, include, ignore });
  }

  for (const target of targets) {
    const ext = Fs.extname(target.path).toLowerCase();
    const dir = Fs.dirname(target.path);
    await Fs.ensureDir(dir);
    if (ext === '.json') {
      await Fs.write(target.path, Json.stringify(tree));
      continue;
    }
    if (ext === '.yaml' || ext === '.yml') {
      await Fs.write(target.path, SlugTree.toYaml(tree));
      continue;
    }
    console.info(c.yellow(`warning: fs:slug-tree skipped unsupported target: ${target.raw}`));
  }
}

function normalizeTargets(input?: t.StringPath | readonly t.StringPath[]): t.StringPath[] {
  if (!input) return [];
  const list = Array.isArray(input) ? input : [input];
  return list.map((value) => String(value).trim()).filter(Boolean) as t.StringPath[];
}

async function copySlugTreeSource(args: {
  root: t.StringDir;
  targetDir: t.StringDir;
  include?: readonly string[];
  ignore?: readonly string[];
}) {
  const include = (args.include ?? ['.md']).map((ext) => ext.toLowerCase());
  const ignore = new Set([...DEFAULT_IGNORE, ...(args.ignore ?? [])]);

  await copyDir(args.root, args.targetDir);

  async function copyDir(sourceDir: string, targetDir: string): Promise<void> {
    for await (const entry of Deno.readDir(sourceDir)) {
      if (isIgnored(entry.name, ignore)) continue;
      const source = Fs.join(sourceDir, entry.name);
      const target = Fs.join(targetDir, entry.name);

      if (entry.isDirectory) {
        await copyDir(source, target);
        continue;
      }

      if (!entry.isFile || !isIncluded(entry.name, include)) continue;
      await Fs.copyFile(source, target, { force: true });
    }
  }
}

function isIgnored(name: string, ignore: Set<string>): boolean {
  if (name.startsWith('.')) return true;
  return ignore.has(name);
}

function isIncluded(name: string, include: readonly string[]): boolean {
  const ext = Fs.extname(name).toLowerCase();
  return include.includes(ext);
}
