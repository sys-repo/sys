import { type t, Delete, Is, Yaml, isEmptyRecord } from './common.ts';

type RequiredYamlShape = Required<t.EsmDeps.YamlShape>;

export const toYaml: t.EsmDeps.Lib['toYaml'] = (entries, options = {}) => {
  const obj: t.EsmDeps.YamlShape = { groups: {}, 'deno.json': [], 'package.json': [] };

  const target = (target: t.EsmDeps.TargetFile, entry: t.EsmDeps.Entry) => {
    if (!entry.target.includes(target)) return;
    const o = obj as RequiredYamlShape;
    pushEntry(o[target], entry);

    if (Is.func(options.groupBy)) {
      type Args = t.EsmDeps.CategorizeByGroupArgs;
      const group: Args['group'] = (groupName, options = {}) => {
        groupName = (groupName || '').trim();
        const dev = options.dev || undefined;
        if (!groupName) return;
        pushEntry(getGroupList(o, groupName), { ...entry, dev: undefined });
        pushGroup(o[target], groupName, target === 'package.json' ? dev : undefined);
      };
      options.groupBy({ entry, target, group });
    }
  };

  entries.forEach((entry) => {
    target('deno.json', entry);
    target('package.json', entry);
  });

  clean(obj);
  dedupeGroups(obj, 'deno.json');
  dedupeGroups(obj, 'package.json');

  let text = '';
  const api: t.EsmDeps.Yaml = {
    obj,
    get text() {
      if (text) return text;
      const yaml = Yaml.stringify(obj);
      if (yaml.error) throw yaml.error;
      return (text = yaml.data ?? '');
    },
    toString: () => api.text,
  };
  return api;
};

function dedupeGroups(obj: t.EsmDeps.YamlShape, target: t.EsmDeps.TargetFile) {
  const o = obj as RequiredYamlShape;
  const groups = o[target]?.filter((entry) => Is.str(entry.group));
  groups.forEach((entry) => {
    const group = o.groups[entry.group!].filter((item) => !!item.import);
    const imports = group.filter((item) => !!item.import).map((item) => item.import!);
    const allExist = group.every((item) => o[target].some((current) => current.import === item.import));
    if (allExist) obj[target] = o[target].filter((item) => !imports.includes(item.import!));
  });
}

function pushEntry(list: t.EsmDeps.YamlEntry[], entry: t.EsmDeps.Entry) {
  const dev = entry.dev || undefined;
  const module = entry.module;
  const subpaths = wrangle.subpaths(entry.subpaths);
  const existing = list.find((item) => item.import === module.toString());
  if (!existing) {
    list.push(Delete.undefined({ import: module.toString(), dev, subpaths }));
  } else {
    if (dev) existing.dev = dev;
    if (subpaths) existing.subpaths = wrangle.mergeSubpaths(existing.subpaths, subpaths);
  }
}

function pushGroup(list: t.EsmDeps.YamlEntry[], group: string, dev?: boolean) {
  dev = dev || undefined;
  const existing = list.find((item) => item.group === group);
  if (!existing) {
    list.push(Delete.undefined({ group, dev }));
  } else {
    if (dev) existing.dev = dev;
  }
}

const getGroupList = (obj: t.EsmDeps.YamlShape, name: string) => {
  const o = obj as RequiredYamlShape;
  return o.groups[name] || (o.groups[name] = []);
};

function clean(obj: t.EsmDeps.YamlShape) {
  if (isEmptyRecord(obj.groups)) {
    delete obj.groups;
  } else {
    const o = obj as RequiredYamlShape;
    Object.keys(o.groups)
      .filter((key) => o.groups[key].length === 0)
      .forEach((key) => delete o.groups[key]);
  }
}

/**
 * Helpers:
 */
const wrangle = {
  subpaths(input?: readonly string[]): string[] | undefined {
    if (!Array.isArray(input)) return;
    const subpaths = input
      .map((path) => String(path).trim())
      .filter(Boolean)
      .map((path) => path.replace(/^\/+/, '').replace(/\/+$/, ''));
    return subpaths.length === 0 ? undefined : subpaths;
  },

  mergeSubpaths(a?: readonly string[], b?: readonly string[]): string[] | undefined {
    const subpaths = [...new Set([...(a ?? []), ...(b ?? [])])].sort((x, y) => x.localeCompare(y));
    return subpaths.length === 0 ? undefined : subpaths;
  },
} as const;
