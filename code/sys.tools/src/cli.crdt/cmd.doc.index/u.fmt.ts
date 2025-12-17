import { type t, Cli, Str, c } from '../common.ts';
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

      const filter = snapshot.source.filter;
      const schemaVersion = snapshot['schema:version'];
      const totals = snapshot.meta?.total ?? {};
      const total = { files: totals.files ?? 0, bytes: totals.bytes ?? 0 };
      const size = `${c.white(Str.bytes(total.bytes))} over ${c.white(total.files.toLocaleString())} ${Str.plural(total.files, 'file', 'files')}`;

      kv('schema', c.gray(`${c.gray(snapshot.kind)}${c.white(`@v${schemaVersion}`)}`));
      kv('size', c.gray(size));
      kv('src:dir', c.gray(`./${c.white(Str.trimLeadingSlashes(snapshot.source.dir))}`));
      kv('crdt:mount/path', mountPath);

      const includeExt = filter?.includeExt?.map((e) => `.${e}`).join(' ');
      const excludeExt = filter?.excludeExt?.map((e) => `.${e}`).join(' ');
      kv('file types', includeExt);
      kv('- excluded', excludeExt);

      kv('glob', filter?.includeGlob?.join(' '));
      kv('- excluded', filter?.excludeGlob?.join(' '));

      const str = Str.builder()
        .blank()
        .line(c.cyan('index:snapshot'))
        .line(Str.trimEdgeNewlines(String(table)))
        .blank();

      return String(str);
    },
  },
} as const;
