import { Is, Num, Path, Pkg, type t } from './common.ts';
import {
  type BrowserPolicySnapshot,
  INVALID_BROWSER_POLICY,
  snapshotBrowserPolicy,
} from './u.browser.ts';
import { type InputRecord, snapshotRecord } from './u.record.ts';

const START_KEYS = [
  'dir',
  'integrity',
  'limits',
  'hostname',
  'port',
  'browserPolicy',
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
  'browserPolicy',
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

type SharedStartSnapshot = {
  readonly dir: t.StringDir;
  readonly limits: Readonly<t.FsPkg.Dist.Verify.Limits>;
  readonly hostname: t.StringHostname;
  readonly port: t.PortNumber;
  readonly browserPolicy?: BrowserPolicySnapshot;
  readonly name?: string;
  readonly silent?: boolean;
  readonly keyboard?: t.HttpServer.Start.Options['keyboard'];
  readonly until?: t.UntilInput;
};

export type StartSnapshot = SharedStartSnapshot & {
  readonly integrity: t.StringHash;
};

export type StartLocalSnapshot = SharedStartSnapshot;

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

/** Keys admitted by checksum-pinned start and serve authority. */
export const PINNED_START_KEYS = START_KEYS;

/** Keys admitted by locally verified start and serve authority. */
export const LOCAL_START_KEYS = START_KEYS_LOCAL;

/** Required keys for checksum-pinned start and serve authority. */
export const PINNED_START_REQUIRED_KEYS = REQUIRED_KEYS;

/** Required keys for locally verified start and serve authority. */
export const LOCAL_START_REQUIRED_KEYS = REQUIRED_KEYS_LOCAL;

/** Snapshot all direct pinned hosting authority before the first asynchronous boundary. */
export function snapshotStartInput(input: unknown): StartPreparation {
  try {
    const source = snapshotRecord(input, START_KEYS, REQUIRED_KEYS);
    if (!source) return rejected('invalid-input');

    const limits = snapshotLimits(source.limits);
    if (!validDir(source.dir) || !limits) return rejected('invalid-input');

    const integrity = snapshotIntegrity(source.integrity);
    if (!integrity) return rejected('invalid-input');

    const dir = Path.resolve(Path.cwd(), source.dir) as t.StringAbsoluteDir;
    const shared = snapshotSharedStart(source, limits, dir);
    if (!shared.ok) return rejected(shared.reason);

    return {
      ok: true,
      value: Object.freeze({ ...shared.value, integrity }),
    };
  } catch {
    return rejected('invalid-input');
  }
}

/** Snapshot all direct locally verified hosting authority before the first asynchronous boundary. */
export function snapshotStartLocalInput(input: unknown): StartLocalPreparation {
  try {
    const source = snapshotRecord(input, START_KEYS_LOCAL, REQUIRED_KEYS_LOCAL);
    if (!source) return rejectedLocal('invalid-input');

    const limits = snapshotLimits(source.limits);
    if (!validDir(source.dir) || !limits) return rejectedLocal('invalid-input');

    const dir = Path.resolve(Path.cwd(), source.dir) as t.StringAbsoluteDir;
    const shared = snapshotSharedStart(source, limits, dir);
    if (!shared.ok) return rejectedLocal(shared.reason);

    return {
      ok: true,
      value: shared.value,
    };
  } catch {
    return rejectedLocal('invalid-input');
  }
}

type SharedStartPreparation =
  | { readonly ok: true; readonly value: SharedStartSnapshot }
  | { readonly ok: false; readonly reason: 'invalid-input' | 'invalid-hostname' };

function snapshotSharedStart(
  source: InputRecord,
  limits: Readonly<t.FsPkg.Dist.Verify.Limits>,
  dir: t.StringDir,
): SharedStartPreparation {
  const hostname = source.hostname ?? '127.0.0.1';
  if (!isLoopbackHostname(hostname)) return rejectedShared('invalid-hostname');

  const browserPolicy = snapshotBrowserPolicy(source.browserPolicy, limits.entries);
  if (browserPolicy === INVALID_BROWSER_POLICY) return rejectedShared('invalid-input');
  if (browserPolicy && !isNumericLoopbackHostname(hostname)) {
    return rejectedShared('invalid-hostname');
  }

  const port = source.port ?? 0;
  if (!Num.Is.safeInt(port) || port < 0 || port > 65_535) return rejectedShared('invalid-input');

  const name = source.name;
  if (name !== undefined && (!Is.str(name) || name.length === 0 || name !== name.trim())) {
    return rejectedShared('invalid-input');
  }

  const silent = source.silent;
  if (silent !== undefined && !Is.bool(silent)) return rejectedShared('invalid-input');

  const keyboard = snapshotKeyboard(source.keyboard);
  if (keyboard === INVALID_KEYBOARD) return rejectedShared('invalid-input');

  const until = source.until;
  if (!Is.untilInput(until)) return rejectedShared('invalid-input');

  return {
    ok: true,
    value: Object.freeze({
      dir,
      limits,
      hostname,
      port: port as t.PortNumber,
      ...(browserPolicy === undefined ? {} : { browserPolicy }),
      ...(name === undefined ? {} : { name }),
      ...(silent === undefined ? {} : { silent }),
      ...(keyboard === undefined ? {} : { keyboard }),
      ...(until === undefined ? {} : { until }),
    }),
  };
}

function validDir(input: unknown): input is t.StringDir {
  return Is.str(input) && input.length > 0 && !input.includes('\\0');
}

function snapshotIntegrity(input: unknown): t.StringHash | undefined {
  if (!Is.str(input)) return;
  const parsed = Pkg.Dist.Part.parse(input);
  return parsed?.hash === input && parsed.size === undefined ? (input as t.StringHash) : undefined;
}

function snapshotLimits(input: unknown): Readonly<t.FsPkg.Dist.Verify.Limits> | undefined {
  const source = snapshotRecord(input, LIMIT_KEYS, LIMIT_KEYS);
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
  const source = snapshotRecord(input, KEYBOARD_KEYS, []);
  if (!source) return INVALID_KEYBOARD;
  const { print, exit } = source;
  if (print !== undefined && !Is.bool(print)) return INVALID_KEYBOARD;
  if (exit !== undefined && !Is.bool(exit)) return INVALID_KEYBOARD;
  return Object.freeze({
    ...(print === undefined ? {} : { print }),
    ...(exit === undefined ? {} : { exit }),
  });
}

function isLoopbackHostname(input: unknown): input is t.StringHostname {
  return input === '127.0.0.1' || input === 'localhost' || input === '::1';
}

function isNumericLoopbackHostname(input: unknown): input is t.StringHostname {
  return input === '127.0.0.1' || input === '::1';
}

function positive(input: unknown): input is t.NumberBytes {
  return nonNegative(input) && input > 0;
}

function nonNegative(input: unknown): input is t.NumberBytes {
  return Num.Is.safeInt(input) && input >= 0;
}

function rejectedShared(reason: 'invalid-input' | 'invalid-hostname'): SharedStartPreparation {
  return Object.freeze({ ok: false, reason });
}

function rejected(reason: 'invalid-input' | 'invalid-hostname'): StartPreparation {
  return Object.freeze({ ok: false, reason });
}

function rejectedLocal(reason: 'invalid-input' | 'invalid-hostname'): StartLocalPreparation {
  return Object.freeze({ ok: false, reason });
}
