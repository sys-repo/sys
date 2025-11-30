import { type t, Is, c, Str, Cli, D, Time, Yaml, Obj, Graph, AliasResolver } from '../common.ts';
import { RepoProcess } from '../cmd.repo.daemon/mod.ts';
import { Fmt } from '../u.fmt.ts';
import { walkDocumentGraph } from '../cmd.graph/mod.ts';
import { buildDocumentDAG } from '../cmd.graph/mod.ts';

type N = t.Graph.Dag.Node;
type O = Record<string, unknown>;

export async function lintDocumentGraph(cwd: t.StringDir, docid: t.Crdt.Id, path: t.ObjectPath) {
  const port = D.port.repo;
  const cmd = (await RepoProcess.tryClient(port))!;
  if (!cmd) return;

  let _total = 0;
  const dag = await buildDocumentDAG(cmd, docid, path);
  const Lens = {
    yaml: Obj.Lens.at(path),
    alias: Obj.Lens.at<O>(['alias']),
    sequence: Obj.Lens.at<O>(['data', 'sequence']),
  };

  const Resolve = {
    slug(node: N) {
      const yaml = Lens.yaml.get(node.doc?.current);
      if (!Is.str(yaml)) return;
      const slug = Yaml.parse<O>(yaml).data;
      return Is.record(slug) ? slug : undefined;
    },
    parts(node: N) {
      const slug = Resolve.slug(node);
      const alias = slug ? Lens.alias.get(slug) : undefined;
      const sequence = slug ? Lens.sequence.get(slug) : undefined;
      return { alias, sequence };
    },
  } as const;

  // console.log(`-------------------------------------------`);
  // console.log('dag.nodes[0]', dag.nodes[0]);
  const root = dag.nodes[0];
  const rootAlias = Resolve.parts(root).alias;

  /**
   * Process the graph of odcuments
   */
  await Graph.Dag.forEachAsync(dag, async (node) => {
    const { alias, sequence } = Resolve.parts(node);
    if (!Is.record(alias)) return;
    _total++;

    console.log(`-------------------------------------------`);
    console.log('node.id', node.id);
    console.log('alias', alias);

    // 1) Analyze the table: normalize + collect diagnostics.
    const { resolver, diagnostics } = AliasResolver.analyze(
      { alias }, // root object
      { alias: ['alias'] }, // path to the alias table
    );

    const map = resolver.alias; // t.Alias.Map

    // 2) You can now *lint* the alias table itself:
    //    - invalid keys
    //    - non-string values
    if (diagnostics.length > 0) {
      // surface in your table / markers instead of console later
      for (const d of diagnostics) {
        // d.kind, d.path, d.key, d.value, d.message
      }
    }

    // 3) Optionally check self-consistency by expanding each alias value.
    for (const [key, raw] of Object.entries(map)) {
      if (raw == null) continue;

      const { value, remaining } = AliasResolver.expand(raw, map);

      console.log('value', value);
      console.log('remaining', remaining);

      const fullyResolved = remaining.length === 0;
      // e.g. record this for lint output:
      // - key
      // - raw (original)
      // - value (expanded)
      // - fullyResolved (boolean)
    }

    // 4) And you can use the map for “real” expansion checks:
    //    e.g. validate that some known path field under `slug` fully resolves.
    // const rawPath = slug.path as string | undefined;
    // if (rawPath) {
    //   const { value, remaining } = AliasResolver.expand(rawPath, map);
    //   const ok = remaining.length === 0;
    //   ...
    // }

    // console.log('sequence', sequence);

    /**
     * Expand a raw (string) value using the given alias map.
     * Pure: no external state, no mutation.
     */
    function expandAliasValue(raw: unknown, map: t.Alias.Map) {
      if (typeof raw !== 'string') return undefined;
      return AliasResolver.expand(raw, map);
    }

    type TSeq = { video?: t.StringPath; slice?: t.Timecode.SliceString; timestamps?: unknown[] };

    const m = (Is.array(sequence) ? sequence : [])
      .filter((item) => Is.record(item))
      .map((item) => item as TSeq)
      .map((item) => {
        const { video, slice, timestamps } = item;

        const videoExp = expandAliasValue(video, map);
        console.log('raw', c.cyan(String(video)));
        console.log('videoExp', videoExp);

        return {
          video,
          slice,
          get timestamps() {
            return timestamps;
          },
        };
      });

    console.log('m', m);

    // AliasResolver
  });

  const table = Cli.table();
  table.push([c.bold(c.cyan('Lint'))]);
  table.push([c.gray(' root document:'), Fmt.prettyUri(docid)]);
  table.push([c.gray(` yaml path:`), path ? `/${path.join('/')}` : '-']);
  table.push([
    c.gray(` graph:`),
    `${_total} ${c.gray(Str.plural(_total, 'document', 'documents'))}`,
  ]);

  console.info(String(table));

  console.info();
  console.log('rootAlias', rootAlias);
}
