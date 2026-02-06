import { type t, Fs } from './common.ts';
import { load } from './u.load.ts';

export const Path: t.DenoFileLib['Path'] = {
  async nearest(start, fnStop) {
    start = Fs.resolve(start);
    const filenames = ['deno.json', 'deno.jsonc'];

    const shouldStop = async (path: string): Promise<boolean> => {
      if (typeof fnStop !== 'function') return true;
      const file = (await load(path)).data ?? {};
      return Boolean(await fnStop({ path, file }));
    };

    const info = await Fs.stat(start);
    if (info?.isFile) {
      if (filenames.includes(Fs.basename(start)) && (await shouldStop(start))) return start;
      return Path.nearest(Fs.dirname(start), fnStop);
    }

    if (!info?.isDirectory) {
      return undefined;
    }

    let root: t.StringPath | undefined;
    await Fs.walkUp(start, async (e) => {
      const files = await e.files();
      const denofile =
        files.find((file) => file.name === 'deno.json') ??
        files.find((file) => file.name === 'deno.jsonc');
      if (denofile && (await shouldStop(denofile.path))) {
        root = denofile.path;
        e.stop();
      }
    });

    return root;
  },
};
