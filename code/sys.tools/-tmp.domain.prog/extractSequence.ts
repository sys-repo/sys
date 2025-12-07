import { type t, c, Is, Obj, Cli, Str, Fs } from './common.ts';
import { makeParser } from './u.parser.ts';
import { findClosestFilename } from './u.findClose.ts';

type Dag = t.Graph.Dag.Result;
type N = t.Graph.Dag.Node;
type O = Record<string, unknown>;

export async function extractSequence(dag: Dag, yamlPath: t.ObjectPath, docid: t.Crdt.Id) {
  const Parse = makeParser(yamlPath);

  const root = Parse.parseRoot(dag);
  const node = Parse.findParsedNode(dag, docid);

  // console.log('node', docid, !!node?.slug, !!node?.alias);

  if (!node || !node.slug || !node.alias) return;

  // REQUIRED: both resolvers
  const indexResolver = root.alias?.resolver;
  const localResolver = node.alias.resolver;

  if (!localResolver) {
    console.error('⚠️ Missing local alias resolver on slug node.');
    return;
  }
  if (!indexResolver) {
    console.error('⚠️ Missing index (root) alias resolver.');
    return;
  }

  // Sequence
  const seq = Parse.Lens.sequence.get(node.slug) ?? [];
  asGetters(seq);

  // console.info(c.cyan('localResolver.alias'), localResolver.alias);
  // console.info(c.cyan('indexResolver.alias (root)'), indexResolver.alias);

  const table = Cli.table();
  const kv = (key: string, value?: string) => table.push([c.gray(key), value ?? '-']);

  const total = { paths: 0, notExist: 0 };

  for (const item of seq) {
    try {
      const raw = item?.video;
      if (!Is.str(raw)) continue;

      const resolved = Parse.Resolve.path(raw, localResolver, indexResolver);
      const path = Fs.Tilde.expand(resolved?.value ?? '');
      const exists = await Fs.exists(path);

      total.paths++;
      if (!exists) total.notExist++;

      if (!exists) {
        const siblings = await Fs.glob(Fs.dirname(path)).find('*');
        const filenames = siblings.map((f) => f.path).map((f) => Fs.basename(f));
        const filename = Fs.basename(path);
        console.log('looking for', c.green(filename));

        const closest = findClosestFilename(filename, filenames);
        console.log('maybe', c.italic(c.cyan(closest?.name ?? '-')));
      }

      if (!exists) {
        kv('doc:', c.white(docid));
        kv('- raw:', c.gray(raw));
        kv('- resolved:', resolved?.value ? c.green(resolved.value) : '');
        kv('- exists:', exists ? c.green('✔ ' + exists) : c.red(String(exists)));
        table.push([]);
      }

      // console.log(c.green('result (path)'), resolved?.value);
      // console.log('remaining', resolved?.remaining);
    } catch (err) {
      console.error('Resolve.path error:', err);
    }

    if (String(table)) console.info(String(table));
  }

  /**
   * Apply getter transforms (unchanged).
   */
  function asGetters(seq: unknown) {
    if (!Array.isArray(seq)) return;
    for (const item of seq) {
      Obj.asGetter(item, ['script']);
      if (Is.record(item.timestamps)) {
        Object.values(item.timestamps)
          .filter((v) => Is.record(v))
          .forEach((v) => Obj.asGetter(v as O));
      }
    }
  }
}
