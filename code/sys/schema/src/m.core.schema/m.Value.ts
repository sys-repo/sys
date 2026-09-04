import { Is } from '../common.ts';
import type { TLocalizedValidationError } from 'typebox/error';
import type { Static, StaticParse, TProperties, TSchema } from 'typebox';
import { AssertError as TypeBoxAssertError, Value as TypeBoxValue } from 'typebox/value';
import type { Typebox } from '../t.typebox.ts';

type ValueError = Typebox.Value.Error;
type ValueErrorList = Typebox.Value.ErrorList;

type ValueArgs = [type: TSchema, value: unknown] | [
  context: TProperties,
  type: TSchema,
  value: unknown,
];
type ErrorParams = Record<string, unknown>;

export class AssertError extends Error {
  readonly error: ValueError | undefined;
  readonly errors: ValueErrorList;

  constructor(errors: Iterable<ValueError>, cause?: unknown) {
    const list = toErrorList(errors);
    super(list.First()?.message ?? 'Schema assertion failed', { cause });
    this.name = 'AssertError';
    this.errors = list;
    this.error = list.First();
  }

  /** Returns an iterable list for each error in this value. */
  Errors(): ValueErrorList {
    return this.errors;
  }
}

function Errors<Type extends TSchema>(type: Type, value: unknown): ValueErrorList;
function Errors<Context extends TProperties, Type extends TSchema>(
  context: Context,
  type: Type,
  value: unknown,
): ValueErrorList;
function Errors(...args: ValueArgs): ValueErrorList {
  if (args.length === 2) {
    const [type, value] = args;
    const errors = TypeBoxValue.Errors(type, value);
    return normalizeErrors(errors, type, value);
  }

  const [context, type, value] = args;
  const errors = TypeBoxValue.Errors(context, type, value);
  return normalizeErrors(errors, type, value);
}

function Assert<const Type extends TSchema>(
  type: Type,
  value: unknown,
): asserts value is Static<Type>;
function Assert<Context extends TProperties, const Type extends TSchema>(
  context: Context,
  type: Type,
  value: unknown,
): asserts value is Static<Type, Context>;
function Assert(...args: ValueArgs): void {
  const type = args.length === 2 ? args[0] : args[1];
  const value = args.length === 2 ? args[1] : args[2];
  try {
    if (args.length === 2) TypeBoxValue.Assert(args[0], args[1]);
    else TypeBoxValue.Assert(args[0], args[1], args[2]);
  } catch (error) {
    throw toAssertError(error, type, value);
  }
}

function Parse<const Type extends TSchema>(type: Type, value: unknown): StaticParse<Type>;
function Parse<Context extends TProperties, const Type extends TSchema>(
  context: Context,
  type: Type,
  value: unknown,
): StaticParse<Type, Context>;
function Parse(...args: ValueArgs): unknown {
  return args.length === 2 ? parse(args[0], args[1]) : parse(args[0], args[1], args[2]);
}

export const Value: Typebox.Value.Lib = Object.freeze({
  ...TypeBoxValue,
  Assert,
  Errors,
  Parse,
});

/**
 * Helpers:
 */
function parse(type: TSchema, value: unknown): unknown;
function parse(context: TProperties, type: TSchema, value: unknown): unknown;
function parse(...args: ValueArgs): unknown {
  if (args.length === 2) {
    const [type, value] = args;
    const cloned = TypeBoxValue.Clone(value);
    const cleaned = TypeBoxValue.Clean(type, cloned);
    const withDefaults = TypeBoxValue.Default(type, cleaned);
    const converted = TypeBoxValue.Convert(type, withDefaults);
    Assert(type, converted);
    return converted;
  }

  const [context, type, value] = args;
  const cloned = TypeBoxValue.Clone(value);
  const cleaned = TypeBoxValue.Clean(context, type, cloned);
  const withDefaults = TypeBoxValue.Default(context, type, cleaned);
  const converted = TypeBoxValue.Convert(context, type, withDefaults);
  Assert(context, type, converted);
  return converted;
}

function normalizeErrors(
  errors: readonly TLocalizedValidationError[],
  schema: TSchema,
  value: unknown,
): ValueErrorList {
  const normalized: ValueError[] = [];
  for (const error of errors) normalized.push(...normalizeError(error, schema, value));
  return toErrorList(normalized);
}

function normalizeError(
  error: TLocalizedValidationError,
  schema: TSchema,
  value: unknown,
): ValueError[] {
  const additional = stringParams(error, 'additionalProperties');
  if (additional.length > 0) {
    return additional.map((property) =>
      toValueError(error, schema, value, appendPath(error.instancePath, property))
    );
  }

  const required = stringParams(error, 'requiredProperties');
  if (required.length > 0) {
    return required.map((property) =>
      toValueError(error, schema, value, appendPath(error.instancePath, property))
    );
  }

  return [toValueError(error, schema, value, error.instancePath)];
}

function toValueError(
  error: TLocalizedValidationError,
  schema: TSchema,
  value: unknown,
  path: string,
): ValueError {
  return {
    ...error,
    path,
    message: toMessage(error),
    schema: resolveSchema(schema, error.schemaPath),
    value: resolveValue(value, path),
    errors: [],
  };
}

function toAssertError(error: unknown, schema: TSchema, value: unknown): Error {
  if (error instanceof AssertError) return error;
  if (error instanceof TypeBoxAssertError) {
    return new AssertError(normalizeErrors(error.cause.errors, schema, value), error);
  }
  if (error instanceof Error) return error;
  return new Error(String(error));
}

function toMessage(error: TLocalizedValidationError): string {
  switch (error.keyword) {
    case 'additionalProperties':
      return 'Unexpected property';
    case 'anyOf':
      return 'Expected union value';
    case 'const':
      return `Expected ${formatExpected(param(error, 'allowedValue'))}`;
    case 'minLength':
      return `Expected string length to be greater or equal to ${param(error, 'limit')}`;
    case 'maxLength':
      return `Expected string length to be less or equal to ${param(error, 'limit')}`;
    case 'required':
      return 'Expected required property';
    case 'type':
      return `Expected ${typeName(error)}`;
    default:
      return error.message;
  }
}

function typeName(error: TLocalizedValidationError): string {
  const value = param(error, 'type');
  if (Is.array(value)) return value.map(String).join(' or ');
  return Is.string(value) ? value : error.message;
}

function formatExpected(value: unknown): string {
  return Is.string(value) ? `'${value}'` : String(value);
}

function stringParams(error: TLocalizedValidationError, key: string): string[] {
  const value = param(error, key);
  return Is.array(value) ? value.map(String) : [];
}

function param(error: TLocalizedValidationError, key: string): unknown {
  return (error.params as ErrorParams)[key];
}

function resolveSchema(schema: TSchema, schemaPath: string): TSchema {
  const direct = resolvePointer(schema, schemaPath);
  if (isSchema(direct)) return direct;

  const cyclicTarget = resolveCyclicTarget(schema);
  if (cyclicTarget) {
    const nested = resolvePointer(cyclicTarget, schemaPath);
    if (isSchema(nested)) return nested;
  }

  return schema;
}

function resolveCyclicTarget(schema: TSchema): TSchema | undefined {
  type CyclicLike = { readonly $defs?: Record<string, unknown>; readonly $ref?: unknown };
  const cyclic = schema as CyclicLike;
  if (!Is.string(cyclic.$ref) || !Is.object(cyclic.$defs)) return undefined;
  const target = cyclic.$defs[cyclic.$ref];
  return isSchema(target) ? target : undefined;
}

function resolveValue(value: unknown, path: string): unknown {
  return resolveSegments(value, decodePointer(path));
}

function resolvePointer(value: unknown, pointer: string): unknown {
  const path = pointer.startsWith('#') ? pointer.slice(1) : pointer;
  return resolveSegments(value, decodePointer(path));
}

function resolveSegments(value: unknown, segments: string[]): unknown {
  let current = value;
  for (const segment of segments) {
    if (Is.array(current)) {
      const index = Number(segment);
      if (!Number.isInteger(index)) return undefined;
      current = current[index];
      continue;
    }
    if (!Is.object(current)) return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

function decodePointer(pointer: string): string[] {
  if (!pointer) return [];
  const path = pointer.startsWith('/') ? pointer.slice(1) : pointer;
  return path ? path.split('/').map(unescapePointer) : [];
}

function isSchema(value: unknown): value is TSchema {
  return Is.object(value);
}

function appendPath(path: string, segment: string): string {
  return `${path}${path ? '/' : '/'}${escapePointer(segment)}`;
}

function toErrorList(errors: Iterable<ValueError>): ValueErrorList {
  const list = Array.from(errors);
  return Object.assign(list, { First: () => list[0] }) as ValueErrorList;
}

function unescapePointer(value: string): string {
  return value.replaceAll('~1', '/').replaceAll('~0', '~');
}

function escapePointer(value: string): string {
  return value.replaceAll('~', '~0').replaceAll('/', '~1');
}
