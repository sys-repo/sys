import { type t, c, Date as D, Fs, HashFmt, Path, Pkg, Str } from './common.ts';

export const Fmt: t.DirSnapshotFmtLib = {
  async log(snapshot: t.DirSnapshot, options) {
    console.info(await Fmt.toString(snapshot, options));
  },

  async toString(snapshot: t.DirSnapshot, options = {}) {
    const { Cli } = await import('@sys/cli');

    const target = snapshot.path.target.root;
    const size = await Fs.Size.dir(Path.resolve(target));

    const backupsDir = Fs.dirname(target);
    const backups = (await Fs.glob(backupsDir).find('*', {}))
      .filter((e) => e.isDirectory)
      .map((e) => e.path);

    const title = c.green(c.bold(options.title ?? 'Snapshot'));
    const fmtSize = c.brightGreen(Str.bytes(size.total.bytes));
    const snapshotsPlural = Str.plural(backups.length, 'snapshot', 'snapshots');
    let total = `${size.total.files.toLocaleString()} files `;
    total += c.gray(`in latest of ${backups.length} ${snapshotsPlural} (${fmtSize})`);

    const table = Cli.table([title, options.message ?? '']);
    const push = (label: string, value: string | number) => table.push([c.gray(label), value]);
    const formatPath = (path: t.StringPath) => {
      const REF = '.ref';
      path = Path.trimCwd(path);
      if (path.endsWith(REF)) path = `${path.slice(0, -REF.length)}${c.brightMagenta(c.dim(REF))}`;
      return `./${path}`;
    };

    const date = new Date(snapshot.timestamp);
    const dateFmt = D.format(date, 'd MMM yyyy');

    const distJson = await Pkg.Dist.compute({ dir: snapshot.path.target.files });
    const digest = distJson.dist?.hash.digest;
    const targetRight = `${c.white(dateFmt)} | ${HashFmt.digest(digest, { algo: false })}`;

    push('  source', c.gray(formatPath(snapshot.path.source)));
    push('  target', c.gray(`${formatPath(snapshot.path.target.root)} | ${targetRight}`));
    push('  total', total);

    return table.toString().trim();
  },
};
