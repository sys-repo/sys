import { type t, Str, Cli, c } from '../common.ts';
import { Fmt as Base } from '../u.fmt.ts';

export const Fmt = {
  ...Base,
  Index: {
    snapshotTable(snapshot: t.CrdtIndex.Fs.Snapshot, mountPath: t.StringPath): string {
      const table = Cli.table();

      const kv = (k: string, v?: string | number) => {
        if (v === undefined || v === '') return;
        table.push([c.gray(`  ${k}`), String(v)]);
      };

      const counts = snapshot.meta?.counts;
      const filter = snapshot.source.filter;

      kv('kind', `${snapshot.kind}@v${snapshot.version}`);
      kv('source dir', `./${Str.trimLeadingSlashes(snapshot.source.subdir)}`);
      kv('mount path', mountPath);

      kv('files', counts?.files);
      kv('bytes', Str.bytes(counts?.bytes ?? 0));

      const includeExt = filter?.includeExt?.map((e) => `.${e}`).join(' ');
      const excludeExt = filter?.excludeExt?.map((e) => `.${e}`).join(' ');
      kv('extensions', includeExt);
      kv('- excluded', excludeExt);

      kv('glob', filter?.includeGlob?.join(' '));
      kv('- excluded', filter?.excludeGlob?.join(' '));

      const str = Str.builder()
        .blank()
        .line(c.cyan('Index'))
        .line(Str.trimEdgeNewlines(String(table)))
        .blank();

      return String(str);
    },
  },
};
