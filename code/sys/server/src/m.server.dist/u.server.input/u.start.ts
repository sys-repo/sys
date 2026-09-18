import { Is, Num, Path, Pkg, type t } from './common.ts';
import * as Browser from './u.browser.ts';
import { snapshotRecord } from './u.record.ts';
import { snapshotUntilInput } from './u.until.ts';

const freezeKeys = <const T extends readonly string[]>(...keys: T) => Object.freeze(keys);

/** Closed field registries for pinned and local start authority. */
export const KEYS = Object.freeze({
  PINNED: freezeKeys(
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
  ),
  LOCAL: freezeKeys(
    'dir',
    'limits',
    'hostname',
    'port',
    'browserPolicy',
    'name',
    'silent',
    'keyboard',
    'until',
  ),
  REQUIRED: Object.freeze({
    PINNED: freezeKeys('dir', 'integrity', 'limits'),
    LOCAL: freezeKeys('dir', 'limits'),
  }),
  LIMITS: freezeKeys('manifestBytes', 'entries', 'fileBytes', 'totalBytes'),
  KEYBOARD: freezeKeys('print', 'exit'),
});

const INVALID_KEYBOARD = Symbol('invalid-keyboard');

/** Snapshot all direct pinned hosting authority before the first asynchronous boundary. */
export function snapshotStartInput(input: unknown): t.DistServerInput.Start.Preparation {
  try {
    const source = snapshotRecord(input, KEYS.PINNED, KEYS.REQUIRED.PINNED);
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
export function snapshotStartLocalInput(input: unknown): t.DistServerInput.Start.LocalPreparation {
  try {
    const source = snapshotRecord(input, KEYS.LOCAL, KEYS.REQUIRED.LOCAL);
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

function snapshotSharedStart(
  source: t.DistServerInput.Record,
  limits: Readonly<t.FsPkg.Dist.Verify.Limits>,
  dir: t.StringDir,
): t.DistServerInput.Start.SharedPreparation {
  const hostname = source.hostname ?? '127.0.0.1';
  if (!isLoopbackHostname(hostname)) return rejectedShared('invalid-hostname');

  const browserPolicy = Browser.snapshotBrowserPolicy(source.browserPolicy, limits.entries);
  if (browserPolicy === Browser.INVALID_BROWSER_POLICY) return rejectedShared('invalid-input');
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

  const until = snapshotUntilInput(source.until);
  if (!until) return rejectedShared('invalid-input');

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
      ...(until.value === undefined ? {} : { until: until.value }),
    }),
  };
}

function validDir(input: unknown): input is t.StringDir {
  return Is.str(input) && input.length > 0 && !input.includes('\0');
}

function snapshotIntegrity(input: unknown): t.StringHash | undefined {
  if (!Is.str(input)) return;
  const parsed = Pkg.Dist.Part.parse(input);
  return parsed?.hash === input && parsed.size === undefined ? (input as t.StringHash) : undefined;
}

function snapshotLimits(input: unknown): Readonly<t.FsPkg.Dist.Verify.Limits> | undefined {
  const source = snapshotRecord(input, KEYS.LIMITS, KEYS.LIMITS);
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
  const source = snapshotRecord(input, KEYS.KEYBOARD, []);
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

function rejectedShared(
  reason: t.DistServerInput.FailureReason,
): t.DistServerInput.Start.SharedPreparation {
  return Object.freeze({ ok: false, reason });
}

function rejected(reason: t.DistServerInput.FailureReason): t.DistServerInput.Start.Preparation {
  return Object.freeze({ ok: false, reason });
}

function rejectedLocal(
  reason: t.DistServerInput.FailureReason,
): t.DistServerInput.Start.LocalPreparation {
  return Object.freeze({ ok: false, reason });
}
