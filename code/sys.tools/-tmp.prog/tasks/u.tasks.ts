import { type t, Obj } from '../common.ts';
import { makeParser } from '../u.parser.ts';

export async function tasks(
  dag: t.Graph.Dag.Result,
  yamlPath: t.ObjectPath,
): Promise<t.DocGraphTasksResult> {
  const Parse = makeParser(yamlPath);


  return {};
}
