import { type t, Fs, Hash, Pkg, pkg } from '../common.ts';
import { makeFilter } from './u.serve.filter.ts';

type Args = {
  stat: Deno.FileInfo;
  mime: t.MimeType;
  fsPath: t.StringPath;
  reqPath: t.StringPath;
  allowedMimes: t.ServeMimeLookup;
};

/**
 * Pure async helper for the JSON "view" of the serve route.
 */
export async function serveJsonView(args: Args): Promise<t.ServeJsonViewResult> {
  const { stat, mime, allowedMimes } = args;
  if (stat.isFile) {
    /**
     * File:
     */
    const bytes = stat.size;
    const path = args.reqPath;
    const file = await Fs.read(args.fsPath);
    const hash = file.data ? Hash.sha256(file.data) : '-';
    return {
      kind: 'file',
      body: { mime, path, bytes, hash },
    };
  } else {
    /**
     * Folder:
     */
    const filter = makeFilter({ allowedMimes });
    const res = await Pkg.Dist.compute({
      dir: args.fsPath,
      pkg: { ...pkg, name: Fs.join(pkg.name, 'serve') },
      builder: pkg,
      filter,
    });
    return {
      kind: 'folder',
      body: res.dist,
    };
  }
}
