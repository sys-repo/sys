import { type t, Fs } from './common.ts';

export const Path: t.DenoFileLib['Path'] = {
  async nearest(start) {
    start = Fs.resolve(start);

    const info = await Fs.stat(start);
    if (info?.isFile) {
      if (Fs.basename(start) === 'deno.json') return start;
      return Path.nearest(Fs.dirname(start));
    }
    if (!info?.isDirectory) return undefined;

    let root: t.StringPath | undefined;
    await Fs.walkUp(start, async (e) => {
      // Look for the existence of the [deno.json] file.
      const files = await e.files();
      const denofile = files.find((e) => e.name === 'deno.json');
      if (denofile) {
        root = denofile.path;
        e.stop();
      }
    });

    return root;
  },
};
