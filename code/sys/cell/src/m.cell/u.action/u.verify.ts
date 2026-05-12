import { Is, Path, Str, type t, Yaml } from './common.ts';
import { Fs } from '@sys/fs';

const DEFAULT_TRUSTED = ['@sys/'] as const;

export const verify: t.Cell.Action.Lib['verify'] = async (cell, options = {}) => {
  const descriptors = cell.descriptor.actions ?? [];
  const byName = actionMapOf(descriptors);

  verifyReferences(descriptors, byName);
  verifyCycles(descriptors, byName);

  const actions: t.Cell.Action.VerifiedAction[] = [];
  for (const action of descriptors) {
    if (isCompositeAction(action)) {
      actions.push({ kind: 'composite', action });
      continue;
    }

    const specifier = resolveImportSpecifier(cell, action, options);
    const loaded = action.config ? await loadConfig(cell, action, action.config) : undefined;
    const endpoint = await loadEndpoint(action, specifier);

    actions.push({
      kind: 'leaf',
      action,
      paths: loaded ? { config: loaded.path } : {},
      ...(loaded ? { config: loaded.config } : {}),
      endpoint,
    });
  }

  return { actions };
};

/**
 * Helpers:
 */
function actionMapOf(actions: readonly t.Cell.Action.Descriptor[]) {
  const byName = new Map<string, t.Cell.Action.Descriptor>();
  actions.forEach((action) => {
    if (!byName.has(action.name)) byName.set(action.name, action);
  });
  return byName;
}

function verifyReferences(
  actions: readonly t.Cell.Action.Descriptor[],
  byName: ReadonlyMap<string, t.Cell.Action.Descriptor>,
) {
  for (const action of actions) {
    if (!isCompositeAction(action)) continue;

    for (const step of action.steps) {
      if (byName.has(step.action)) continue;
      throw new Error(
        `Cell.Action.verify: action '${action.name}' references unknown action '${step.action}'.`,
      );
    }
  }
}

function verifyCycles(
  actions: readonly t.Cell.Action.Descriptor[],
  byName: ReadonlyMap<string, t.Cell.Action.Descriptor>,
) {
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const stack: string[] = [];

  for (const action of actions) visit(action.name);

  function visit(name: string) {
    if (visited.has(name)) return;

    const action = byName.get(name);
    if (!action) return;

    if (!isCompositeAction(action)) {
      visited.add(name);
      return;
    }

    if (visiting.has(name)) {
      const cycleStart = stack.indexOf(name);
      const cycle = [...stack.slice(cycleStart), name];
      throw new Error(`Cell.Action.verify: action cycle detected: ${cycle.join(' -> ')}`);
    }

    visiting.add(name);
    stack.push(name);

    for (const step of action.steps) visit(step.action);

    stack.pop();
    visiting.delete(name);
    visited.add(name);
  }
}

function resolveImportSpecifier(
  cell: t.Cell.Instance,
  action: t.Cell.Action.Leaf,
  options: t.Cell.Action.VerifyOptions,
): string {
  const from = action.from.trim();

  if (Path.Is.absolute(from)) {
    throw new Error(
      `Cell.Action.verify: absolute action import for '${action.name}' is not allowed: ${from}`,
    );
  }

  if (isRelativeSpecifier(from)) return resolveLocalImportSpecifier(cell, action, from);

  const trusted = options.trusted ?? DEFAULT_TRUSTED;
  const ok = trusted.some((prefix) => from.startsWith(prefix));
  if (!ok) {
    throw new Error(`Cell.Action.verify: untrusted action import for '${action.name}': ${from}`);
  }

  return from;
}

function resolveLocalImportSpecifier(
  cell: t.Cell.Instance,
  action: t.Cell.Action.Leaf,
  from: string,
): string {
  const root = Path.resolve(cell.root, '.');
  const path = Path.resolve(root, from) as t.StringPath;

  if (!isInsideRoot(root, path)) {
    throw new Error(
      `Cell.Action.verify: local action import for '${action.name}' escapes Cell root: ${from}`,
    );
  }

  return String(Fs.Path.toFileUrl(path));
}

async function loadConfig(
  cell: t.Cell.Instance,
  action: t.Cell.Action.Leaf,
  path: t.Cell.Path,
): Promise<{ readonly path: t.StringPath; readonly config: Record<string, unknown> }> {
  const configPath = resolveCellPath(cell.root, action, path);
  const read = await Fs.readText(configPath);
  if (!read.ok) {
    throw new Error(
      `Cell.Action.verify: failed to read config for '${action.name}': ${configPath}`,
    );
  }

  const parsed = Yaml.parse<unknown>(read.data ?? '');
  if (parsed.error) {
    const err =
      `Cell.Action.verify: failed to parse config YAML for '${action.name}': ${configPath}`;
    throw new Error(err, { cause: parsed.error });
  }

  if (!Is.record(parsed.data)) {
    const err =
      `Cell.Action.verify: config for '${action.name}' must be a YAML object: ${configPath}`;
    throw new Error(err);
  }

  return { path: configPath, config: parsed.data };
}

async function loadEndpoint(
  action: t.Cell.Action.Leaf,
  specifier: string,
): Promise<t.Cell.Action.Endpoint> {
  let mod: unknown;
  try {
    mod = await import(/* @vite-ignore */ specifier);
  } catch (cause) {
    const err = `Cell.Action.verify: failed to import action '${action.name}': ${action.from}`;
    throw new Error(err, { cause });
  }

  const endpoint = (mod as Record<string, unknown>)[action.export];

  if (!Is.record(endpoint) || !Is.func(endpoint.run)) {
    const err =
      `Cell.Action.verify: '${action.from}' export '${action.export}' must expose run(...) for action '${action.name}'.`;
    throw new Error(err);
  }

  return endpoint as t.Cell.Action.Endpoint;
}

function resolveCellPath(
  root: t.StringDir,
  action: t.Cell.Action.Leaf,
  path: t.Cell.Path,
): t.StringPath {
  const rootAbs = Path.resolve(root, '.');
  const relative = Str.trimLeadingDotSlash(path);
  const resolved = Path.resolve(rootAbs, relative) as t.StringPath;

  if (!isInsideRoot(rootAbs, resolved)) {
    throw new Error(
      `Cell.Action.verify: config for '${action.name}' escapes Cell root: ${path}`,
    );
  }

  return resolved;
}

function isInsideRoot(root: string, path: string) {
  const relative = Path.relative(root, path);
  return relative === '' || (!relative.startsWith('..') && !Path.Is.absolute(relative));
}

function isRelativeSpecifier(value: string) {
  return value.startsWith('./') || value.startsWith('../');
}

function isCompositeAction(
  action: t.Cell.Action.Descriptor,
): action is t.Cell.Action.Composite {
  return Is.array((action as { readonly steps?: unknown }).steps);
}
