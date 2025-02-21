import { Fs } from '@sys/fs';

console.log('tmp 🐷\n');

const glob = Fs.glob(Fs.resolve('./.tmp/sample/dist'));
const paths = (await glob.find('*.{d.ts,mjs}')).map((m) => m.path);

const toDir = Fs.resolve('../../sys.tmp/src/-sample.lib/dist');
await Fs.remove(toDir);

for (const from of paths) {
  const to = Fs.join(toDir, Fs.basename(from));

  await Fs.copy(from, to);
  console.log('from:', from);
  console.log('to:  ', to);
  console.log('');
}
