import { type t, Obj } from './common.ts';

type O = Record<string, unknown>;

export function makeLenses(yamlPath: t.ObjectPath) {
  const yaml = Obj.Lens.at<string>(yamlPath);
  const alias = Obj.Lens.at<O>(['alias']);
  const data = Obj.Lens.at<O>(['data']);
  const traits = Obj.Lens.at<t.SlugTrait[]>(['traits']);
  const tasks = Obj.Lens.at<unknown[]>(['TASKS']);
  return Obj.asGetter({ yaml, alias, data, traits, tasks });
}
