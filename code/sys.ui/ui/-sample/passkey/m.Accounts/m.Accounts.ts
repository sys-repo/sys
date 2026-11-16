import { Obj, Schema, type t } from './common.ts';
import { payloads, results } from './u.schema.ts';

/**
 * Account wire admission, without IO, serialization, verification, or session authority.
 * Inputs must be bounded, decoded JSON. Valid values are returned unchanged, not sanitized or cloned.
 */
export const Accounts: t.Accounts.Lib = {
  readPayload<N extends t.Accounts.Name>(name: N, input: unknown) {
    if (!Obj.hasOwn(payloads, name) || !Schema.Value.Check(payloads[name], input)) return undefined;
    // The operation-selected schema establishes the private wire contract, not authentication.
    return input as t.Accounts.Payload[N];
  },
  readResult<N extends t.Accounts.Name>(name: N, input: unknown) {
    if (!Obj.hasOwn(results, name) || !Schema.Value.Check(results[name], input)) return undefined;
    return input as t.Accounts.Result[N];
  },
};
