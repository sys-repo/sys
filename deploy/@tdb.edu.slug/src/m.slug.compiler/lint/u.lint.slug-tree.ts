import { type t, c, Fs, Json } from './common.ts';
import { SlugTree } from '../slug.SlugTree/mod.ts';
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

  const targets = normalizeTargets(config.target?.dir).map((target) => ({
    raw: target,
    path: Fs.Path.resolve(cwd, Fs.Tilde.expand(String(target))),
  }));

  if (targets.length === 0) {
    console.info(c.yellow('warning: fs:slug-tree skipped (no target configured)'));
    return;
  }

  const tree = await SlugTree.fromDir(
    { root, createCrdt },
    {
      include: config.include ? [...config.include] : undefined,
      ignore: config.ignore ? [...config.ignore] : undefined,
      sort: config.sort,
      readmeAsIndex: config.readmeAsIndex,
    },
  );

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
