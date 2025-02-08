import { type t, Yaml } from './common.ts';

export function toYaml(deps: t.Dep[], options: t.DepsYamlOptions = {}): t.DepsYaml {
  const obj: Required<t.YamlDeps> = { groups: {}, 'deno.json': [], 'package.json': [] };

  const pushDep = (target: t.DepTargetFile, dep: t.Dep) => {
    if (!dep.target.includes(target)) return;

    const groupExists = (list: t.YamlDep[], name: string) => list.some((m) => (m.group = name));
    const importExists = (list: t.YamlDep[], name: string) => list.some((m) => (m.import = name));

    const { dev, wildcard } = dep;
    const module = dep.module;
    const group = options.groupBy?.(dep) || '';

    if (group) {
      const groupList = obj.groups[group] || (obj.groups[group] = []);
      groupList.push({ import: module.toString() });
      obj[target].push({ group, dev, wildcard });
    } else {
      const { dev, wildcard } = dep;
      obj[target].push({ import: module.toString(), dev, wildcard });
    }
  };

  deps.forEach((dep) => {
    pushDep('deno.json', dep);
    pushDep('package.json', dep);
  });


  let _text = '';
  const api = {
    obj,
    get text() {
      return _text || (_text = Yaml.stringify(obj));
    },
    toString: () => api.text,
  };
  return api;
}
