import { type t, Delete, Yaml, isEmptyRecord } from './common.ts';

type R = Required<t.YamlDeps>;

/**
 * Sequence:
 *  - calculate groups (via function).
 *  - process deps onto <target>.json.
 *  - de-dupe into groups.
 */
export function toYaml(deps: t.Dep[], options: t.DepsYamlOptions = {}): t.DepsYaml {
  const obj: t.YamlDeps = { groups: {}, 'deno.json': [], 'package.json': [] };

  const target = (target: t.DepTargetFile, dep: t.Dep) => {
    if (!dep.target.includes(target)) return;
    const o = obj as R;
    pushDep(o[target], dep);

    if (typeof options.groupBy === 'function') {
      type Args = t.DepsCategorizeByGroupArgs;
      const group: Args['group'] = (groupName, options = {}) => {
        groupName = (groupName || '').trim();
        const dev = options.dev || undefined;
        const wildcard = options.wildcard || undefined;
        if (!groupName) return;
        pushDep(getGroupList(o, groupName), { ...dep, wildcard, dev: undefined });
        pushGroup(o[target], groupName, target === 'package.json' ? dev : undefined);
      };
      options.groupBy({ dep, target, group });
    }
  };

  deps.forEach((dep) => {
    target('deno.json', dep);
    target('package.json', dep);
  });

  /**
   * Clean up and de-dupe.
   */
  clean(obj);
  dedupeGroups(obj, 'deno.json');
  dedupeGroups(obj, 'package.json');

  /**
   * API.
   */
  let _text = '';
  const api: t.DepsYaml = {
    obj,
    get text() {
      return _text || (_text = Yaml.stringify(obj));
    },
    toString: () => api.text,
  };
  return api;
}

/**
 * Helpers
 */
function dedupeGroups(obj: t.YamlDeps, target: t.DepTargetFile) {
  const o = obj as R;
  const groups = o[target]?.filter((m) => typeof m.group === 'string');
  groups.forEach((m) => {
    const group = o.groups[m.group!].filter((m) => !!m.import);
    const imports = group.filter((m) => !!m.import).map((m) => m.import!);
    const allExist = group.every((g) => o[target].some((m) => m.import === g.import));
    if (allExist) obj[target] = o[target].filter((m) => !imports.includes(m.import!));
  });
}

function pushDep(list: t.YamlDep[], dep: t.Dep) {
  const dev = dep.dev || undefined;
  const wildcard = dep.wildcard || undefined;
  const module = dep.module;
  const existing = list.find((m) => m.import === module.toString());
  if (!existing) {
    list.push(Delete.undefined({ import: module.toString(), dev, wildcard }));
  } else {
    if (dev) existing.dev = dev;
    if (wildcard) existing.wildcard = wildcard;
  }
}

function pushGroup(list: t.YamlDep[], group: string, dev?: boolean) {
  dev = dev || undefined;
  const existing = list.find((m) => m.group === group);
  if (!existing) {
    list.push(Delete.undefined({ group, dev }));
  } else {
    if (dev) existing.dev = dev;
  }
}

const getGroupList = (obj: t.YamlDeps, name: string) => {
  const o = obj as R;
  return o.groups[name] || (o.groups[name] = []);
};

function clean(obj: t.YamlDeps) {
  if (isEmptyRecord(obj.groups)) {
    delete obj.groups;
  } else {
    const o = obj as R;
    Object.keys(o.groups)
      .filter((key) => o.groups[key].length === 0)
      .forEach((key) => delete o.groups[key]);
  }
}
