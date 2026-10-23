import { Type as UpstreamType } from 'typebox';
import type { TCyclic, TProperties, TRef, TSchema, TSchemaOptions } from 'typebox';
import type { Typebox } from '../t.typebox.ts';

const PRIVATE_SELF_REF_SUFFIX = '.Self';

let recursiveOrdinal = 0;

export const Type: Typebox.Lib = Object.freeze({
  ...UpstreamType,
  Recursive,
});

/**
 * Helpers:
 */
function Recursive<const Schema extends TSchema>(
  callback: (thisType: TRef<string>) => Schema,
  options: TSchemaOptions = {},
): TCyclic<Record<string, Schema> & TProperties, string> {
  const rootId = typeof options.$id === 'string' && options.$id.length > 0
    ? options.$id
    : `T${recursiveOrdinal++}`;

  /**
   * `Type.Recursive` is the @sys/schema named recursive constructor.
   * Upstream Cyclic requires the self-reference to target a `$defs` entry.
   * Keep the root `$id` as the public schema identity while self traversal
   * points at a private definition.
   */
  const ref = `${rootId}${PRIVATE_SELF_REF_SUFFIX}`;
  const schema = callback(UpstreamType.Ref(ref));
  const defs = { [ref]: schema } as Record<string, Schema> & TProperties;
  return UpstreamType.Cyclic(defs, ref, { ...options, $id: rootId });
}
