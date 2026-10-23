import { type t, YamlConfig } from '../common.ts';
import {
  initialConfig,
  loadConfig,
  parseRoot,
  resolveConfigRef,
  sameRoot,
  stringifyConfig,
  validateConfigText,
} from './u.doc.ts';

type RootSetChange = {
  readonly kind: 'added' | 'updated' | 'exists';
  readonly config: t.HttpProxy.Config.Doc;
  readonly root: t.HttpProxy.Root.Doc;
};

const ERROR_PREFIX = 'HttpProxy root set';

/** Create or update the root/default upstream in a reverse-proxy config YAML document. */
export async function set(
  input: t.HttpProxy.Root.SetInput,
): Promise<t.HttpProxy.Root.SetResult> {
  const resolved = resolveConfig(input);
  const desiredRoot = parseRoot(input, ERROR_PREFIX);
  const edit = await YamlConfig.Edit.update<t.HttpProxy.Config.Doc, RootSetChange>({
    cwd: input.cwd,
    config: resolved.path,
    dryRun: input.dryRun,
    initial: () => resolved.doc,
    load: (path) => loadConfig(path, ERROR_PREFIX),
    mutate: (doc, context) => {
      const kind = context.created
        ? 'added'
        : sameRoot(doc.root, desiredRoot)
        ? 'exists'
        : 'updated';
      const next = {
        ...doc,
        root: desiredRoot,
      } satisfies t.HttpProxy.Config.Doc;
      return {
        doc: next,
        changed: kind !== 'exists',
        change: { kind, config: next, root: desiredRoot },
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
    root: edit.change.root,
  };
}

function resolveConfig(input: t.HttpProxy.Root.SetInput) {
  const ref = resolveConfigRef(input.config, ERROR_PREFIX);
  return {
    path: ref.path,
    doc: initialConfig(input, ref, ERROR_PREFIX),
  };
}
