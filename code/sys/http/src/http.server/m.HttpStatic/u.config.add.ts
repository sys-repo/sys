import { type t, YamlConfig } from './common.ts';
import {
  loadConfig,
  resolveConfig,
  sameConfig,
  stringifyConfig,
  validateConfigText,
} from './u.config.doc.ts';

export { resolveConfigRef } from './u.config.doc.ts';

type ConfigAddChange = {
  readonly kind: 'added' | 'updated' | 'exists';
  readonly config: t.HttpStatic.ConfigDoc;
};

/** Create or update a static-server config YAML document. */
export async function add(
  input: t.HttpStatic.ConfigAddInput,
): Promise<t.HttpStatic.ConfigAddResult> {
  const resolved = resolveConfig(input);
  const desired = resolved.doc;
  const edit = await YamlConfig.Edit.update<t.HttpStatic.ConfigDoc, ConfigAddChange>({
    cwd: input.cwd,
    config: resolved.path,
    dryRun: input.dryRun,
    initial: () => desired,
    load: loadConfig,
    mutate: (doc, context) => {
      const same = sameConfig(doc, desired);
      const kind = context.created ? 'added' : same ? 'exists' : 'updated';
      return {
        doc: desired,
        changed: kind !== 'exists',
        change: { kind, config: desired },
      };
    },
    stringify: stringifyConfig,
    validateText: validateConfigText,
  });

  return {
    kind: edit.kind === 'dry-run' ? 'dry-run' : edit.change.kind,
    yamlPath: edit.path,
    created: edit.created,
    config: edit.change.config,
  };
}
