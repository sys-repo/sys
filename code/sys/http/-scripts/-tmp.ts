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
 * Pull locally (toDir):
 */
// if (!(await Fs.exists(dir))) {
//   const fetched = await Pkg.Dist.fetch(url);
//
//   console.log('dist', fetched);
//   console.log('\nfetched/dist:', fetched.dist);
//
//   const base = url.replace(/dist\.json$/, '');
//   const urls = Object.keys(fetched.dist?.hash.parts ?? {}).map((path) => base + path);
//
//   // Pull the assets from remote origin:
//   const relativeTo = '/sys/driver.monaco';
//   const { ok, ops } = await Http.Pull.toDir(urls, dir, { client, map: { relativeTo } });
//   console.log('pull ok:', ok, 'files:', ops.length);
// }

/**
 * Pull locally (with progress events):
 */
if (!(await Fs.exists(dir))) {
  const fetched = await Pkg.Dist.fetch(url);

  console.log('dist', fetched);
  console.log('\nfetched/dist:', fetched.dist);

  const base = url.replace(/dist\.json$/, '');
  const urls = Object.keys(fetched.dist?.hash.parts ?? {}).map((path) => base + path);

  const relativeTo = '/sys/driver.monaco';
  console.log(`\nPulling ${urls.length} assets → ${dir}\n`);

  let okCount = 0;
  let errorCount = 0;

  for await (const ev of Http.Pull.stream(urls, dir, { client, map: { relativeTo } })) {
    switch (ev.kind) {
      case 'start':
        console.log(`→ start [${ev.index + 1}/${ev.total}] ${ev.url}`);
        break;

      case 'done':
        okCount++;
        console.log(`✓ done   ${ev.record.path.target} (${ev.record.bytes} bytes)`);
        break;

      case 'error':
        errorCount++;
        console.error(`✗ error  ${ev.record.path.source}: ${ev.record.error}`);
        break;
    }
  }

  console.log(`\nPull complete: ${okCount} ok, ${errorCount} failed\n`);
}

/**
 * Server:
 */
console.info();
start({ dir });
