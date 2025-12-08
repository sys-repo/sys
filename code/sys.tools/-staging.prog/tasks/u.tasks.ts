import { type t, Is, makeParser, Obj } from './common.ts';
import { Fmt } from './u.fmt.ts';

export type R = {
  total: { docs: number };
  docs: t.DocTasks[];
  toString(): string;
};

export async function tasks(dag: t.Graph.Dag.Result, yamlPath: t.ObjectPath): Promise<R> {
  const Parse = makeParser(yamlPath);
  const docs: t.DocTasks[] = [];

  /**
   * Query for tasks.
   */
  for (const node of dag.nodes) {
    const slug = Parse.Resolve.slug(node);
    if (!slug) continue;

    const tasks = Parse.Lens.tasks
      .get(slug, [])
      .filter((t) => Is.record(t))
      .filter((t) => Is.str(t.TODO));

    if (tasks.length > 0) {
      docs.push(Obj.asGetter({ doc: { id: node.id }, tasks }, ['tasks']));
    }
  }

  /**
   * Final result:
   */
  const total = { docs: docs.length };
  const toString = () => Fmt.tasks(docs);
  return Obj.asGetter({ total, docs, toString }, ['docs']) satisfies R;
}
