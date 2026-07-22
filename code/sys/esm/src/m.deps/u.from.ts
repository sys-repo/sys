import { Arr, Err, Esm, Fs, Is, Semver, type t, Yaml } from './common.ts';
import { PackageJsonPolicy } from './u.packageJson.policy.ts';
import { toYaml } from './u.toYaml.ts';

export const from: t.EsmDeps.Lib['from'] = async (input) => {
  const errors = Err.errors();
  let fatal = false;

  const fail = (err: string | t.StdError) => {
    errors.push(err);
    return done();
  };
  const reject = (err: string | t.StdError) => {
    fatal = true;
    errors.push(err);
  };
  const done = (data?: t.EsmDeps.State): t.EsmDeps.Result => {
    let error = errors.toError();
    if (!data && !error) error = Err.std('Dependency manifest data could not be retrieved');
    return { data, error };
  };

  let yaml: t.EsmDeps.YamlShape | undefined;
  if (is.yamlPath(input)) {
    const path = Fs.resolve(input);
    const file = await Fs.readYaml<t.EsmDeps.YamlShape>(path);
    if (!file.exists) return fail(`Failed to load YAML at path: ${path}`);
    yaml = file.data;
  } else {
    const parsed = Yaml.parse<t.EsmDeps.YamlShape>(input);
    if (parsed.error) {
      return fail(
        Err.std('Failed while parsing given YAML', { cause: parsed.error.cause ?? parsed.error }),
      );
    }
    yaml = parsed.data ?? undefined;
  }
  if (!yaml) {
    return fail('Failed to load YAML');
  }

  const groups = Is.object(yaml.groups) ? yaml.groups : {};
  const overrides: t.PkgNodeOverrides = {};

  Object.entries(groups).forEach(([groupName, group]) => {
    if (!Array.isArray(group)) return;
    group.forEach((item, index) => {
      if (PackageJsonPolicy.hasOverridesItem(item)) {
        reject(`Invalid deps.yaml: overrides are not allowed in groups.${groupName}[${index}]`);
      }
    });
  });

  const entries: t.EsmDeps.Entry[] = [];
  const addEntry = (
    item: t.EsmDeps.YamlEntry,
    target: t.EsmDeps.TargetFile,
    dev?: boolean,
    subpaths?: t.StringDir[],
    nameAlias?: string,
  ): t.EsmDeps.Entry | undefined => {
    if (Is.str(item?.group)) {
      const group = groups[item.group];
      if (Array.isArray(group)) {
        group.forEach((groupItem) => {
          const item = groupItem as t.EsmDeps.YamlEntry;
          addEntry(item, target, item.dev ?? dev, item.subpaths, item.name);
        });
      }
    }

    if (!Is.str(item?.import)) return;

    const module = Esm.parse(item.import, nameAlias);
    if (module.error) errors.push(`${module.error.message} ("${module.input}")`);

    const entry: t.EsmDeps.Entry = {
      target: [target],
      get module() {
        return module;
      },
    };

    if (dev) entry.dev = true;
    if (Array.isArray(subpaths)) {
      entry.subpaths = subpaths.map((path) => path.replace(/^\/+/, ''));
    }

    entries.push(entry);
  };

  if (Array.isArray(yaml['deno.json'])) {
    yaml['deno.json'].forEach((item, index) => {
      if (PackageJsonPolicy.hasOverridesItem(item)) {
        reject(`Invalid deps.yaml: overrides are not allowed in deno.json[${index}]`);
        return;
      }
      addEntry(item, 'deno.json', false, item.subpaths, item.name)!;
    });
  }
  if (Array.isArray(yaml['package.json'])) {
    yaml['package.json'].forEach((item, index) => {
      if (PackageJsonPolicy.hasOverridesItem(item)) {
        const parsed = PackageJsonPolicy.parseOverridesItem(item, index);
        if (parsed.error) reject(parsed.error);
        if (parsed.overrides) PackageJsonPolicy.mergeOverrides(overrides, parsed.overrides, reject);
        return;
      }
      addEntry(item, 'package.json', item.dev, item.subpaths, item.name)!;
    });
  }

  if (fatal) return done();

  const packageJson = PackageJsonPolicy.toPolicy(overrides);
  const dedupedMap = new Map<string, t.EsmDeps.Entry>();
  for (const entry of entries) {
    const id = wrangle.entryId(entry);
    if (!dedupedMap.has(id)) {
      dedupedMap.set(id, entry);
    } else {
      const existing = dedupedMap.get(id)!;
      dedupedMap.set(id, wrangle.mergeEntry(existing, entry));
    }
  }

  const deduped = Array.from(dedupedMap.values());
  return done({
    entries: deduped,
    modules: Esm.modules(deduped.map((entry) => entry.module)),
    packageJson,
    toYaml: (options = {}) => {
      const hasPackageJson = PackageJsonPolicy.hasOwn(options, 'packageJson');
      return toYaml(deduped, {
        ...options,
        packageJson: hasPackageJson ? options.packageJson : packageJson,
      });
    },
  });
};

const is = {
  yamlPath(path?: string): boolean {
    if (!path) return false;
    return path.endsWith('.yaml') || path.endsWith('.yml');
  },
} as const;

const wrangle = {
  entryId(entry: t.EsmDeps.Entry): string {
    return `${entry.module.registry}:${entry.module.name}:${entry.module.alias}`;
  },

  mergeEntry(existing: t.EsmDeps.Entry, entry: t.EsmDeps.Entry): t.EsmDeps.Entry {
    const module = Semver.Is.greaterThan(entry.module.version, existing.module.version)
      ? entry.module
      : existing.module;

    return {
      module,
      target: Arr.uniq([...existing.target, ...entry.target]).toSorted(),
      dev: existing.dev || entry.dev || undefined,
      subpaths: wrangle.mergeSubpaths(existing.subpaths, entry.subpaths),
    };
  },

  mergeSubpaths(
    a?: t.EsmDeps.Entry['subpaths'],
    b?: t.EsmDeps.Entry['subpaths'],
  ): t.EsmDeps.Entry['subpaths'] {
    const subpaths = Arr.uniq([...(a ?? []), ...(b ?? [])]);
    return subpaths.length === 0 ? undefined : subpaths;
  },
} as const;
