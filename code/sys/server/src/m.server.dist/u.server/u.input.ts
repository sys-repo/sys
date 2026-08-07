import { FsPkg, Is, Num, Obj, type t } from '../common.ts';

const START_KEYS = [
  'dir',
  'integrity',
  'limits',
  'hostname',
  'port',
  'name',
  'silent',
  'keyboard',
  'until',
] as const;
const START_KEYS_LOCAL = [
  'dir',
  'limits',
  'hostname',
  'port',
  'name',
  'silent',
  'keyboard',
  'until',
] as const;
const REQUIRED_KEYS = ['dir', 'integrity', 'limits'] as const;
const REQUIRED_KEYS_LOCAL = ['dir', 'limits'] as const;
const LIMIT_KEYS = ['manifestBytes', 'entries', 'fileBytes', 'totalBytes'] as const;
const KEYBOARD_KEYS = ['print', 'exit'] as const;
const INVALID_KEYBOARD = Symbol('invalid-keyboard');

export type StartSnapshot = Readonly<{
  dir: t.StringDir;
  integrity: t.StringHash;
  limits: Readonly<t.FsPkg.Dist.Pinned.Verify.Limits>;
  hostname: t.StringHostname;
  port: t.PortNumber;
  name?: string;
  silent?: boolean;
  keyboard?: t.HttpServer.Start.Options['keyboard'];
  until?: t.UntilInput;
}>;

export type StartLocalSnapshot = Readonly<{
  dir: t.StringDir;
  limits: Readonly<t.FsPkg.Dist.Verify.Limits>;
  hostname: t.StringHostname;
  port: t.PortNumber;
  name?: string;
  silent?: boolean;
  keyboard?: t.HttpServer.Start.Options['keyboard'];
  until?: t.UntilInput;
}>;

export type StartPreparation =
  | { readonly ok: true; readonly value: StartSnapshot }
  | {
    readonly ok: false;
    readonly reason: Extract<t.DistServer.StartFailureReason, 'invalid-input' | 'invalid-hostname'>;
  };

export type StartLocalPreparation =
  | { readonly ok: true; readonly value: StartLocalSnapshot }
  | {
    readonly ok: false;
    readonly reason: Extract<t.DistServer.StartFailureReason, 'invalid-input' | 'invalid-hostname'>;
  };

/** Snapshot all direct hosting authority before the first asynchronous boundary. */
export function snapshotStartInput(input: unknown): StartPreparation {
  try {
    const source = dataRecord(input, START_KEYS, REQUIRED_KEYS);
    if (!source) return rejected('invalid-input');

    const dir = source.dir;
    const integrity = source.integrity;
    const limits = snapshotLimits(source.limits);
    if (!Is.str(dir) || dir.length === 0 || dir.includes('\\0')) return rejected('invalid-input');
    if (!canonicalHash(integrity) || !limits) return rejected('invalid-input');

    const hostname = source.hostname ?? '127.0.0.1';
    if (!isLoopbackHostname(hostname)) return rejected('invalid-hostname');

    const port = source.port ?? 0;
    if (!Num.Is.safeInt(port) || port < 0 || port > 65_535) return rejected('invalid-input');

    const name = source.name;
    if (name !== undefined && (!Is.str(name) || name.length === 0 || name !== name.trim())) {
      return rejected('invalid-input');
    }

    const silent = source.silent;
    if (silent !== undefined && !Is.bool(silent)) return rejected('invalid-input');

    const keyboard = snapshotKeyboard(source.keyboard);
    if (keyboard === INVALID_KEYBOARD) return rejected('invalid-input');

    const until = source.until;
    if (!Is.untilInput(until)) return rejected('invalid-input');

    return {
      ok: true,
      value: Object.freeze({
        dir: dir as t.StringDir,
        integrity: integrity as t.StringHash,
        limits,
        hostname,
        port: port as t.PortNumber,
        ...(name === undefined ? {} : { name }),
        ...(silent === undefined ? {} : { silent }),
        ...(keyboard === undefined ? {} : { keyboard }),
        ...(until === undefined ? {} : { until }),
      }),
    };
  } catch {
    return rejected('invalid-input');
  }
}

export function snapshotStartLocalInput(input: unknown): StartLocalPreparation {
  try {
    const source = dataRecord(input, START_KEYS_LOCAL, REQUIRED_KEYS_LOCAL);
    if (!source) return rejectedLocal('invalid-input');

    const dir = source.dir;
    const limits = snapshotLimits(source.limits);
    if (!Is.str(dir) || dir.length === 0 || dir.includes('\\0')) return rejectedLocal('invalid-input');
    if (!limits) return rejectedLocal('invalid-input');

    const hostname = source.hostname ?? '127.0.0.1';
    if (!isLoopbackHostname(hostname)) return rejectedLocal('invalid-hostname');

    const port = source.port ?? 0;
    if (!Num.Is.safeInt(port) || port < 0 || port > 65_535) return rejectedLocal('invalid-input');

    const name = source.name;
    if (name !== undefined && (!Is.str(name) || name.length === 0 || name !== name.trim())) {
      return rejectedLocal('invalid-input');
    }

    const silent = source.silent;
    if (silent !== undefined && !Is.bool(silent)) return rejectedLocal('invalid-input');

    const keyboard = snapshotKeyboard(source.keyboard);
    if (keyboard === INVALID_KEYBOARD) return rejectedLocal('invalid-input');

    const until = source.until;
    if (!Is.untilInput(until)) return rejectedLocal('invalid-input');

    return {
      ok: true,
      value: Object.freeze({
        dir: dir as t.StringDir,
        limits,
        hostname,
        port: port as t.PortNumber,
        ...(name === undefined ? {} : { name }),
        ...(silent === undefined ? {} : { silent }),
        ...(keyboard === undefined ? {} : { keyboard }),
        ...(until === undefined ? {} : { until }),
      }),
    };
  } catch {
    return rejectedLocal('invalid-input');
  }
}

function snapshotLimits(input: unknown): t.FsPkg.Dist.Pinned.Verify.Limits | undefined {
  const source = dataRecord(input, LIMIT_KEYS, LIMIT_KEYS);
  if (!source) return;
  const { manifestBytes, entries, fileBytes, totalBytes } = source;
  if (!positive(manifestBytes) || !positive(entries)) return;
  if (!nonNegative(fileBytes) || !nonNegative(totalBytes)) return;
  return Object.freeze({ manifestBytes, entries, fileBytes, totalBytes });
}

function snapshotKeyboard(
  input: unknown,
): t.HttpServer.Start.Options['keyboard'] | typeof INVALID_KEYBOARD | undefined {
  if (input === undefined || Is.bool(input)) return input;
  const source = dataRecord(input, KEYBOARD_KEYS, []);
  if (!source) return INVALID_KEYBOARD;
  const { print, exit } = source;
  if (print !== undefined && !Is.bool(print)) return INVALID_KEYBOARD;
  if (exit !== undefined && !Is.bool(exit)) return INVALID_KEYBOARD;
  return Object.freeze({
    ...(print === undefined ? {} : { print }),
    ...(exit === undefined ? {} : { exit }),
  });
}

function dataRecord(
  input: unknown,
  allowed: readonly string[],
  required: readonly string[],
): Record<string, unknown> | undefined {
  if (!Is.plainObject(input)) return;
  const keys = Reflect.ownKeys(input);
  if (keys.some((key) => !Is.str(key) || !allowed.includes(key))) return;
  if (required.some((key) => !Obj.hasOwn(input, key))) return;

  const output: Record<string, unknown> = {};
  for (const key of keys) {
    if (!Is.str(key)) return;
    const descriptor = Object.getOwnPropertyDescriptor(input, key);
    if (!descriptor || !Obj.hasOwn(descriptor, 'value')) return;
    output[key] = descriptor.value;
  }
  return output;
}

function canonicalHash(input: unknown): input is t.StringHash {
  if (!Is.str(input)) return false;
  const parsed = FsPkg.Dist.Part.parse(input);
  return parsed?.hash === input && parsed.size === undefined;
}

function isLoopbackHostname(input: unknown): input is t.StringHostname {
  return input === '127.0.0.1' || input === 'localhost' || input === '::1';
}

function positive(input: unknown): input is t.NumberBytes {
  return nonNegative(input) && input > 0;
}

function nonNegative(input: unknown): input is t.NumberBytes {
  return Num.Is.safeInt(input) && input >= 0;
}

function rejected(reason: 'invalid-input' | 'invalid-hostname'): StartPreparation {
  return Object.freeze({ ok: false, reason });
}

function rejectedLocal(reason: 'invalid-input' | 'invalid-hostname'): StartLocalPreparation {
  return Object.freeze({ ok: false, reason });
}
