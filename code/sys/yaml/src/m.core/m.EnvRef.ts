import { Is, type t } from './common.ts';
import { Error } from './m.Error.ts';
import { YamlIs } from './m.Is.ts';
import { walk } from './u/u.walk.ts';

const REF_PREFIX = '${env:';
const WHOLE_REF = /^\$\{env:([^}]*)\}$/;
const ENV_NAME = /^[A-Z_][A-Z0-9_]*$/;
const ERROR_CODE: t.Yaml.Error['code'] = 'BAD_ALIAS';

type FoundRef = {
  readonly ref: t.Yaml.EnvRef.Ref;
  readonly node: t.Yaml.Scalar;
};

type ResolvedRef = FoundRef & {
  readonly value: string;
};

/** Pure YAML env-ref helpers. */
export const EnvRef: t.Yaml.EnvRef.Lib = Object.freeze({
  resolveAst(ast, options) {
    const refs: FoundRef[] = [];
    const errors: t.Yaml.Error[] = [];

    walk(ast, (e) => {
      if (!YamlIs.scalar(e.node)) return;
      if (!Is.string(e.node.value)) return;

      const scalar = e.node.value;
      if (!scalar.includes(REF_PREFIX)) return;

      const match = WHOLE_REF.exec(scalar);
      if (!match) {
        errors.push(syntaxError(e.path, e.node, scalar));
        return;
      }

      const name = match[1] ?? '';
      if (!ENV_NAME.test(name)) {
        errors.push(nameError(e.path, e.node, name));
        return;
      }

      refs.push({
        node: e.node,
        ref: { path: e.path, name },
      });
    });

    const resolved: ResolvedRef[] = [];
    if (errors.length === 0) {
      for (const item of refs) {
        const value = resolveValue(item, options, errors);
        if (value === undefined) continue;
        resolved.push({ ...item, value });
      }
    }

    const refRecords = refs.map((item) => item.ref);
    if (errors.length > 0) {
      return { ok: false, ast, errors, refs: refRecords };
    }

    for (const item of resolved) {
      item.node.value = item.value;
    }

    return { ok: true, ast, refs: refRecords };
  },
});

function resolveValue(
  item: FoundRef,
  options: t.Yaml.EnvRef.Resolve.Options,
  errors: t.Yaml.Error[],
): string | undefined {
  try {
    const value = options.get(item.ref.name);
    if (value === undefined) {
      errors.push(missingError(item.ref, item.node));
      return undefined;
    }
    return value;
  } catch (cause) {
    errors.push(resolverError(item.ref, item.node, cause));
    return undefined;
  }
}

function syntaxError(path: t.ObjectPath, node: t.Yaml.Scalar, value: string): t.Yaml.Error {
  return synthetic(path, node, `contains unsupported env ref syntax: ${value}`);
}

function nameError(path: t.ObjectPath, node: t.Yaml.Scalar, name: string): t.Yaml.Error {
  const label = name ? name : '<empty>';
  return synthetic(path, node, `references invalid env var name: ${label}`);
}

function missingError(ref: t.Yaml.EnvRef.Ref, node: t.Yaml.Scalar): t.Yaml.Error {
  return synthetic(ref.path, node, `references missing env var: ${ref.name}`);
}

function resolverError(ref: t.Yaml.EnvRef.Ref, node: t.Yaml.Scalar, cause: unknown): t.Yaml.Error {
  const detail = cause instanceof globalThis.Error ? cause.message : String(cause);
  return synthetic(ref.path, node, `env var resolver failed for ${ref.name}: ${detail}`);
}

function synthetic(path: t.ObjectPath, node: t.Yaml.Scalar, message: string): t.Yaml.Error {
  return Error.synthetic({
    message: `${pathLabel(path)} ${message}`,
    code: ERROR_CODE,
    pos: posOf(node),
  });
}

function posOf(node: t.Yaml.Scalar): readonly [number, number] {
  const range = node.range;
  if (!range) return [0, 0];
  return [range[0], range[1]];
}

function pathLabel(path: t.ObjectPath): string {
  if (path.length === 0) return '<root>';
  return path.reduce<string>((label, part) => {
    if (Is.num(part)) return `${label}[${part}]`;
    return label ? `${label}.${part}` : part;
  }, '');
}
