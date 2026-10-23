import { type t, YamlConfig } from '../common.ts';
import {
  initialConfig,
  loadConfig,
  resolveConfigRef,
  sameLifecycle,
  stringifyConfig,
  validateConfigText,
} from './u.doc.ts';

type ConfigAddChange = {
  readonly kind: 'added' | 'updated' | 'exists';
  readonly config: t.HttpProxy.Config.Doc;
};

const ERROR_PREFIX = 'HttpProxy config add';

/** Create or update a reverse-proxy config YAML document. */
export async function add(
  input: t.HttpProxy.Config.AddInput,
): Promise<t.HttpProxy.Config.AddResult> {
  const resolved = resolveConfig(input);
  const desiredLifecycle = resolved.doc;
  const edit = await YamlConfig.Edit.update<t.HttpProxy.Config.Doc, ConfigAddChange>({
    cwd: input.cwd,
    config: resolved.path,
    dryRun: input.dryRun,
    initial: () => desiredLifecycle,
    load: (path) => loadConfig(path, ERROR_PREFIX),
    mutate: (doc, context) => {
      const desired = {
        ...desiredLifecycle,
        root: doc.root,
        mounts: doc.mounts,
      } satisfies t.HttpProxy.Config.Doc;
      const same = sameLifecycle(doc, desiredLifecycle);
      const kind = context.created ? 'added' : same ? 'exists' : 'updated';
      return {
        doc: desired,
        changed: kind !== 'exists',
        change: { kind, config: desired },
      };
    },
    stringify: (doc) => stringifyConfig(doc, ERROR_PREFIX),
    validateText: (text, path) => validateConfigText(text, path, ERROR_PREFIX),
  });

  return {
    kind: edit.kind === 'dry-run' ? 'dry-run' : edit.change.kind,
    yamlPath: edit.path,
    created: edit.created,
    config: edit.change.config,
  };
}

function resolveConfig(input: t.HttpProxy.Config.AddInput) {
  const ref = resolveConfigRef(input.config, ERROR_PREFIX);
  return {
    path: ref.path,
    doc: initialConfig(input, ref, ERROR_PREFIX),
  };
}
