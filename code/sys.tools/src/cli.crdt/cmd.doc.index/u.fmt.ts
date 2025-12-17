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

      const counts = snapshot.meta?.total;
      const filter = snapshot.source.filter;
      const schemaVersion = snapshot['schema:version'];

      kv('src:dir', c.gray(`./${c.white(Str.trimLeadingSlashes(snapshot.source.dir))}`));
      kv('crdt:mount/path', mountPath);
      kv('schema', c.gray(`${c.gray(snapshot.kind)}${c.white(`@v${schemaVersion}`)}`));

      kv('files', (counts?.files ?? 0).toLocaleString());
      kv('bytes', Str.bytes(counts?.bytes ?? 0));

      const includeExt = filter?.includeExt?.map((e) => `.${e}`).join(' ');
      const excludeExt = filter?.excludeExt?.map((e) => `.${e}`).join(' ');
      kv('extensions', includeExt);
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
};
