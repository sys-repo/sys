import { Obj, Pkg, type t } from './common.ts';
import * as Start from './u.start.ts';
import { selectFields, snapshotRecord } from './u.record.ts';

const KEYS = {
  PINNED: [...Start.KEYS.PINNED, 'pkgSubpath', 'navigation'],
  LOCAL: [...Start.KEYS.LOCAL, 'pkgSubpath', 'navigation'],
} as const;

const INVALID_NAVIGATION = Symbol('invalid-navigation');

/** Snapshot terminal presentation separately from strict pinned start authority. */
export function snapshotServeInput(input: unknown): t.DistServerInput.Serve.Preparation {
  try {
    const source = snapshotRecord(input, KEYS.PINNED, Start.KEYS.REQUIRED.PINNED);
    if (!source) return rejectedServe('invalid-input');

    const parsed = Pkg.Subpath.parse(source.pkgSubpath);
    if (parsed.kind === 'invalid') return rejectedServe('invalid-input');
    const navigation = snapshotNavigation(source);
    if (navigation === INVALID_NAVIGATION) return rejectedServe('invalid-input');

    const start = Start.snapshotStartInput(selectFields(source, Start.KEYS.PINNED));
    if (!start.ok) return rejectedServe(start.reason);

    return {
      ok: true,
      value: Object.freeze({
        start: start.value,
        displayDir: source.dir as t.StringDir,
        navigation,
        ...(parsed.kind === 'valid' ? { pkgSubpath: parsed.value } : {}),
      }),
    };
  } catch {
    return rejectedServe('invalid-input');
  }
}

/** Snapshot terminal presentation separately from strict local start authority. */
export function snapshotServeLocalInput(
  input: unknown,
): t.DistServerInput.Serve.LocalPreparation {
  try {
    const source = snapshotRecord(input, KEYS.LOCAL, Start.KEYS.REQUIRED.LOCAL);
    if (!source) return rejectedServeLocal('invalid-input');

    const parsed = Pkg.Subpath.parse(source.pkgSubpath);
    if (parsed.kind === 'invalid') return rejectedServeLocal('invalid-input');
    const navigation = snapshotNavigation(source);
    if (navigation === INVALID_NAVIGATION) return rejectedServeLocal('invalid-input');

    const start = Start.snapshotStartLocalInput(selectFields(source, Start.KEYS.LOCAL));
    if (!start.ok) return rejectedServeLocal(start.reason);

    return {
      ok: true,
      value: Object.freeze({
        start: start.value,
        displayDir: source.dir as t.StringDir,
        navigation,
        ...(parsed.kind === 'valid' ? { pkgSubpath: parsed.value } : {}),
      }),
    };
  } catch {
    return rejectedServeLocal('invalid-input');
  }
}

function snapshotNavigation(
  source: t.DistServerInput.Record,
): t.DistServerInput.Serve.Navigation | typeof INVALID_NAVIGATION {
  if (!Obj.hasOwn(source, 'navigation')) return 'default';
  if (source.navigation !== 'nested') return INVALID_NAVIGATION;
  if (Obj.hasOwn(source, 'silent') || Obj.hasOwn(source, 'keyboard')) return INVALID_NAVIGATION;
  return 'nested';
}

function rejectedServe(
  reason: t.DistServerInput.FailureReason,
): t.DistServerInput.Serve.Preparation {
  return Object.freeze({ ok: false, reason });
}

function rejectedServeLocal(
  reason: t.DistServerInput.FailureReason,
): t.DistServerInput.Serve.LocalPreparation {
  return Object.freeze({ ok: false, reason });
}
