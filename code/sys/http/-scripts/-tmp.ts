import { Fs, Pkg } from '@sys/fs';
import { Http } from '@sys/http';
import { start } from '@sys/http/serve';

const clear = async (root: string) => {
  const paths = await Fs.glob(root, { includeDirs: true }).find('*');
  for (const p of paths) await Fs.remove(p.path, { log: true });
};
await clear('./.tmp');

/**
 * Context:
 */
const client = Http.client();
const url = 'https://fs.db.team/sys/driver.monaco/dist.json';
const dir = './.tmp/pulled';

/**
 * Pull locally:
 */
if (!(await Fs.exists(dir))) {
  const fetched = await Pkg.Dist.fetch(url);

  console.log('dist', fetched);
  console.log('\nfetched/dist:', fetched.dist);

  const base = url.replace(/dist\.json$/, '');
  const urls = Object.keys(fetched.dist?.hash.parts ?? {}).map((path) => base + path);

  // Pull the assets from remote origin:
  const relativeTo = '/sys/driver.monaco';
  const { ok, ops } = await Http.Pull.toDir(urls, dir, { client, map: { relativeTo } });
  console.log('pull ok:', ok, 'files:', ops.length);
}

/**
 * Server:
 */
console.info();
start({ dir });
