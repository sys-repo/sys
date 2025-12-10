import { type t, Obj } from '../common.ts';

type O = Record<string, unknown>;

export function makeLenses(yamlPath: t.ObjectPath): t.LensLib {
  const yaml = Obj.Lens.at<string>(yamlPath);
  const alias = Obj.Lens.at<O>(['alias']);
  const sequence = Obj.Lens.at<O[]>(['data', 'sequence']);
  const traits = Obj.Lens.at<readonly t.SlugTrait[]>(['traits']);
  const tasks = Obj.Lens.at<t.Task[]>(['TASKS']);
  return Obj.asGetter({
    yaml,
    alias,
    sequence,
    traits,
    tasks,
  });
}
