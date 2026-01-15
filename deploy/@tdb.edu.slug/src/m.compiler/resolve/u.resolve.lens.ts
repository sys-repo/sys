import { type t, Obj } from '../common.ts';

type O = Record<string, unknown>;

export function makeLenses(yamlPath: t.ObjectPath): t.LensLib {
  const yaml = Obj.Lens.at<string>(yamlPath);
  const alias = Obj.Lens.at<O>(['alias']);
  const data = Obj.Lens.at<O>(['data']);
  const traits = Obj.Lens.at<t.SlugTrait[]>(['traits']);
  const tasks = Obj.Lens.at<t.Task[]>(['TASKS']);

  const api: t.LensLib = {
    yaml,
    alias,
    data,
    traits,
    tasks,
  };

  return Obj.asGetter(api);
}
