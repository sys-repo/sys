import { Hash } from '@sys/std/hash';
import { type t, Err, Fs } from './common.ts';

export const Dir: t.HashDirLib = {
  async compute(dir) {
    const exists = await Fs.exists(dir);
    const res: t.HashDir = { exists, dir, hash: '', files: {} };

    if (!exists) {
      res.error = Err.std('Directory does not exist.');
    } else {
      const isDir = await Fs.Is.dir(dir);
      if (!isDir) {
        res.error = Err.std('Path is not a directory.');
      } else {
        const orderedHashes: t.StringHash[] = [];
        const paths = (await Fs.glob(dir).find('**'))
          .filter((m) => m.isFile)
          .map((m) => m.path.substring(dir.length + 1))
          .map((m) => `./${m}`)
          .sort();

        for (const path of paths) {
          const data = await Deno.readFile(Fs.join(dir, path));
          const hash = Hash.sha256(data);
          orderedHashes.push(hash);
          res.files[path] = hash;
        }
        res.hash = Hash.sha256(orderedHashes.join('\n'));
      }
    }

    return res;
  },
};
