import { type t, Fs } from './common.ts';

export const Tmpl: t.TmplLib = {
  create(source, target) {
    const tmplDir = (dir: string): t.TmplDir => {
      return {
        dir,
        async ls() {
          const ls = await Fs.glob(dir).find('**');
          return ls.filter((p) => p.path !== dir).map((p) => p.path);
        },
      };
    };

    const api: t.Tmpl = {
      source: tmplDir(source),
      target: tmplDir(target),
      async copy() {
        const res: t.TmplCopyResponse = { files: [] };

        for (const from of await api.source.ls()) {
          if (await Fs.Is.file(from)) {
            const to = Fs.join(target, from.slice(source.length + 1));
            await Fs.copy(from, to);

            /**
             * TODO 🐷
             * - filter input source (ignore, "userspace" etc)
             * - read the file
             * - format content (optional)
             *
             * - MOVE [Tmpl] → @
             */
          }
        }

        return res;
      },
    };
    return api;
  },
};
