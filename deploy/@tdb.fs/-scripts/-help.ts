import { type t, c, Pkg } from './common.ts';

export async function logHelp(rootDir: t.StringDir) {
  const { dist } = await Pkg.Dist.load(rootDir);
  if (!dist) {
    console.info(c.yellow(`No "/dist" folder found.`));
    return;
  }
  const children = await Pkg.Dist.Log.children(rootDir, dist);

  console.info();
  console.info(Pkg.Dist.Log.dist(dist));
  if (children) console.info(children);
  console.info();
}

/**
 * Run:
 */
logHelp('./dist');
