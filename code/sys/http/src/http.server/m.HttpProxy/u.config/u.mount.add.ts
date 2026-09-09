import { type t, YamlConfig } from '../common.ts';
import {
  initialConfig,
  loadConfig,
  normalizeMounts,
  parseMount,
  resolveConfigRef,
  sameMount,
  stringifyConfig,
  validateConfigText,
} from './u.doc.ts';

type MountAddChange = {
  readonly kind: 'added' | 'updated' | 'exists';
  readonly config: t.HttpProxy.Config.Doc;
  readonly mount: t.HttpProxy.Mount.Doc;
};

const ERROR_PREFIX = 'HttpProxy mount add';

/** Create or update a mounted upstream in a reverse-proxy config YAML document. */
export async function add(
  input: t.HttpProxy.Mount.AddInput,
): Promise<t.HttpProxy.Mount.AddResult> {
  const resolved = resolveConfig(input);
  const desiredMount = parseMount(input, ERROR_PREFIX);
  const edit = await YamlConfig.Edit.update<t.HttpProxy.Config.Doc, MountAddChange>({
    cwd: input.cwd,
    config: resolved.path,
    dryRun: input.dryRun,
    initial: () => resolved.doc,
    load: (path) => loadConfig(path, ERROR_PREFIX),
    mutate: (doc) => {
      const existingIndex = doc.mounts.findIndex((mount) => mount.path === desiredMount.path);
      const existing = existingIndex >= 0 ? doc.mounts[existingIndex] : undefined;
      const kind = !existing ? 'added' : sameMount(existing, desiredMount) ? 'exists' : 'updated';
      const mounts = kind === 'added'
        ? [...doc.mounts, desiredMount]
        : doc.mounts.map((mount, index) => index === existingIndex ? desiredMount : mount);
      const next = {
        ...doc,
        mounts: normalizeMounts(mounts, ERROR_PREFIX),
      } satisfies t.HttpProxy.Config.Doc;
      return {
        doc: next,
        changed: kind !== 'exists',
        change: { kind, config: next, mount: desiredMount },
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
    mount: edit.change.mount,
  };
}

function resolveConfig(input: t.HttpProxy.Mount.AddInput) {
  const ref = resolveConfigRef(input.config, ERROR_PREFIX);
  return {
    path: ref.path,
    doc: initialConfig(input, ref, ERROR_PREFIX),
  };
}
