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

  const toImport = (
    item: t.DenoYamlDep,
    target: t.DenoDepTargetFile,
    dev?: boolean,
    wildcard?: boolean,
  ): t.DenoDep | undefined => {
    if (typeof item?.import !== 'string') return;
    const module = Esm.parse(item.import);
    if (module.error) errors.push(`${module.error.message} ("${module.input}")`);
    const res: t.DenoDep = {
      target,
      get module() {
        return module;
      },
    };
    if (dev) res.dev = true;
    if (wildcard) res.wildcard = true;
    return res;
  };

  const imports: t.DenoDep[] = [];

  if (Array.isArray(yaml['deno.json'])) {
    const items = yaml['deno.json'].map((m) => toImport(m, 'deno.json', false, m.wildcard)!);
    imports.push(...items.filter(Boolean));
  }

  if (Array.isArray(yaml['package.json'])) {
    const items = yaml['package.json'].map((m) => toImport(m, 'package.json', m.dev)!);
    imports.push(...items.filter(Boolean));
  }

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
