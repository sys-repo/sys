import { type t, Fs, Err, Esm } from './common.ts';
import { parse } from 'yaml';

const TARGETS: t.DenoDepTargetFile[] = ['deno.json', 'package.json'];

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

  const isYamlPath = input.endsWith('.yaml') || input.endsWith('.yml');
  let yaml: t.DenoYamlDeps | undefined;
  if (isYamlPath) {
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

  if (!Array.isArray(yaml.imports)) {
    return fail('Invalid YAML: the {imports} array not found');
  }

  const toImport = (item: t.DenoYamlDep): t.DenoDep | undefined => {
    if (typeof item?.import !== 'string') return;
    const module = Esm.parse(item.import);
    if (module.error) errors.push(`${module.error.message} ("${module.input}")`);
    const res: t.DenoDep = {
      get module() {
        return module;
      },
      target: wrangle.target(item),
    };
    if (item.dev) res.dev = true;
    if (item.wildcard) res.wildcard = true;
    return res;
  };

  const imports = yaml.imports.map((item) => toImport(item)!).filter(Boolean);
  return done({ imports });
};

/**
 * Helpers
 */
const wrangle = {
  target(item: t.DenoYamlDep): t.DenoDepTargetFile[] {
    let res: t.DenoDepTargetFile[] = [];
    if (!item.target) return ['deno.json'];
    if (typeof item.target === 'string') res.push(item.target);
    if (Array.isArray(item.target)) res.push(...item.target);
    res = res.filter((item) => TARGETS.includes(item));
    return res.length === 0 ? ['deno.json'] : res;
  },
} as const;
