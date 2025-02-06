import { type t, Semver, Fs, Err, Esm } from './common.ts';
import { parse } from 'yaml';

/**
 * Load the imports definitions from YAML.
 */
export const fromYaml: t.DenoDepsLib['fromYaml'] = async (input) => {
  const errors = Err.errors();

  const fail = (err: string | t.StdError) => {
    errors.push(err);
    return done();
  };
  const done = (data?: t.DenoDeps): t.DenoDepsResponse => {
    let error = errors.toError();
    if (!data && !error) error = Err.std('Imports data could not be retrieved');
    return { data, error };
  };

  /**
   * Read or parse YAML.
   */
  let yaml: t.DenoYamlDeps | undefined;
  if (is.yamlPath(input)) {
    const path = Fs.resolve(input);
    const file = await Fs.readYaml<t.DenoYamlDeps>(path);
    if (!file.exists) return fail(`Failed to load YAML at path: ${path}`);
    yaml = file.data;
  } else {
    try {
      yaml = parse(input);
    } catch (cause: any) {
      return fail(Err.std('Failed while parsing given YAML', { cause }));
    }
  }
  if (!yaml) {
    return fail('Failed to load YAML');
  }

  const groups = typeof yaml.groups === 'object' ? yaml.groups : {};

  /**
   * Deserialize and map into data-structure.
   */
  const deps: t.DenoDep[] = [];
  const addDep = (
    item: t.DenoYamlDep,
    target: t.DenoDepTargetFile,
    dev?: boolean,
    wildcard?: boolean,
  ): t.DenoDep | undefined => {
    if (typeof item?.group === 'string') {
      const group = groups[item.group];
      if (Array.isArray(group)) {
        group.forEach((m) => {
          const item = m as t.DenoYamlDep;
          addDep(item, target, item.dev, item.wildcard);
        });
      }
    }

    if (typeof item?.import !== 'string') return;

    const module = Esm.parse(item.import);
    if (module.error) errors.push(`${module.error.message} ("${module.input}")`);

    const res: t.DenoDep = {
      target: [target],
      get module() {
        return module;
      },
    };

    if (dev) res.dev = true;
    if (wildcard) res.wildcard = true;
    deps.push(res);
  };

  if (Array.isArray(yaml['deno.json'])) {
    yaml['deno.json'].forEach((m) => addDep(m, 'deno.json', false, m.wildcard)!);
  }
  if (Array.isArray(yaml['package.json'])) {
    yaml['package.json'].forEach((m) => addDep(m, 'package.json', m.dev)!);
  }

  /**
   * De-dupe.
   */
  const dedupedMap = new Map<string, t.DenoDep>();
  for (const item of deps) {
    const name = item.module.name;
    if (!dedupedMap.has(name)) {
      dedupedMap.set(name, item);
    } else {
      /**
       * Merge targets:
       *  - ensuring no duplicate target values.
       *  - ensuring highest version is retained.
       */
      const existing = dedupedMap.get(name)!;
      for (const target of item.target) {
        if (!existing.target.includes(target)) {
          existing.target.push(target);
        }
        if (Semver.Is.greaterThan(item.module.version, existing.module.version)) {
          existing.module.version = item.module.version;
        }
      }
    }
  }

  /**
   * Finish up.
   */
  const deduped = Array.from(dedupedMap.values());
  return done({
    deps: deduped,
    modules: Esm.modules(deduped.map((m) => m.module)),
  });
};

/**
 * Helpers
 */

const is = {
  yamlPath(path?: string): boolean {
    if (!path) return false;
    return path.endsWith('.yaml') || path.endsWith('.yml');
  },
} as const;
