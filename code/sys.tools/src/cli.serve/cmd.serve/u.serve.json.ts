import { type t, pkg, D, Fs, Hash } from '../common.ts';
import { Fmt } from '../u.fmt.ts';
import { makeFilter } from './u.serve.filter.ts';

type Args = {
  stat: Deno.FileInfo;
  mime: t.ServeTool.MimeType;
  path: { fs: t.StringPath; req: t.StringPath };
  allowedMimes: t.ServeTool.MimeLookup;
};

/**
 * Pure async helper for the JSON "view" of the serve route.
 */
export async function serveJsonView(args: Args): Promise<t.ServeTool.JsonViewResult> {
  const { stat, mime, allowedMimes } = args;

  if (stat.isFile) {
    /**
     * File:
     */
    const bytes = stat.size;
    const path = args.path.req;
    const file = await Fs.read(args.path.fs);
    const hash = file.data ? Hash.sha256(file.data) : '-';
    return {
      kind: 'file',
      body: { mime, path, bytes, hash },
    };
  } else {
    /**
     * Folder:
     */
    const dir = Fs.basename(args.path.fs);
    const filter = makeFilter({ allowedMimes });

    type Body = t.ServeTool.JsonViewFolder['body'];
    const files: Body['files'] = [];
    const entries = await Fs.glob(args.path.fs).find('*');

    for (const entry of entries) {
      if (!filter(entry.name)) continue;
      const name = entry.isDirectory ? `${entry.name}/` : entry.name;
      files.push(name);
    }

    return {
      kind: 'folder',
      body: { dir, files, about: { cmd: 'serve', pkg } },
    };
  }
}
