import type { t } from '../common.ts';
export type * from '../t.internal.ts';
export type { HttpCmd } from '@sys/http/t';

/** Native signing algorithms supported by the synthetic authenticator. */
export type AuthenticatorAlgorithm = -7 | -8 | -257;

/** Fixture-only COSE map; permits deliberately malformed key parameters. */
export type CoseKeyMap = Map<number, number | Uint8Array<ArrayBuffer>>;

/** The fixture's none-attestation fields, before CBOR encoding. */
export type AttestationMap = Map<string, string | Map<string, never> | Uint8Array<ArrayBuffer>>;

export type CeremonyOverrides = {
  origin?: string;
  rpId?: string;
  challenge?: string;
  counter?: number;
  userVerified?: boolean;
  badSignature?: boolean;
  flags?: number;
  extensions?: readonly number[];
  clientData?: Record<string, unknown>;
};
export type Authenticator = {
  readonly id: string;
  registration(
    options: t.Accounts.Wire.CreationOptions,
    changes?: CeremonyOverrides,
  ): t.Accounts.Wire.Registration;
  assertion(
    options: t.Accounts.Wire.RequestOptions,
    handle: string,
    changes?: CeremonyOverrides,
  ): Promise<t.Accounts.Wire.Authentication>;
};
