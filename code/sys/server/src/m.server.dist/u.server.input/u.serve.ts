import { Pkg, type t } from './common.ts';
import {
  LOCAL_START_KEYS,
  LOCAL_START_REQUIRED_KEYS,
  PINNED_START_KEYS,
  PINNED_START_REQUIRED_KEYS,
  snapshotStartInput,
  snapshotStartLocalInput,
  type StartLocalSnapshot,
  type StartSnapshot,
} from './u.start.ts';
import { selectFields, snapshotRecord } from './u.record.ts';

const PINNED_SERVE_KEYS = [...PINNED_START_KEYS, 'pkgSubpath'] as const;
const LOCAL_SERVE_KEYS = [...LOCAL_START_KEYS, 'pkgSubpath'] as const;

export type ServeSnapshot = {
  readonly start: StartSnapshot;
  readonly pkgSubpath?: string;
};

export type ServeLocalSnapshot = {
  readonly start: StartLocalSnapshot;
  readonly displayDir: t.StringDir;
  readonly pkgSubpath?: string;
};

export type ServePreparation =
  | { readonly ok: true; readonly value: ServeSnapshot }
  | {
    readonly ok: false;
    readonly reason: Extract<t.DistServer.StartFailureReason, 'invalid-input' | 'invalid-hostname'>;
  };

export type ServeLocalPreparation =
  | { readonly ok: true; readonly value: ServeLocalSnapshot }
  | {
    readonly ok: false;
    readonly reason: Extract<t.DistServer.StartFailureReason, 'invalid-input' | 'invalid-hostname'>;
  };

/** Snapshot terminal presentation separately from strict pinned start authority. */
export function snapshotServeInput(input: unknown): ServePreparation {
  try {
    const source = snapshotRecord(input, PINNED_SERVE_KEYS, PINNED_START_REQUIRED_KEYS);
    if (!source) return rejectedServe('invalid-input');

    const parsed = Pkg.Subpath.parse(source.pkgSubpath);
    if (parsed.kind === 'invalid') return rejectedServe('invalid-input');

    const start = snapshotStartInput(selectFields(source, PINNED_START_KEYS));
    if (!start.ok) return rejectedServe(start.reason);

    return {
      ok: true,
      value: Object.freeze({
        start: start.value,
        ...(parsed.kind === 'valid' ? { pkgSubpath: parsed.value } : {}),
      }),
    };
  } catch {
    return rejectedServe('invalid-input');
  }
}

/** Snapshot terminal presentation separately from strict local start authority. */
export function snapshotServeLocalInput(input: unknown): ServeLocalPreparation {
  try {
    const source = snapshotRecord(input, LOCAL_SERVE_KEYS, LOCAL_START_REQUIRED_KEYS);
    if (!source) return rejectedServeLocal('invalid-input');

    const parsed = Pkg.Subpath.parse(source.pkgSubpath);
    if (parsed.kind === 'invalid') return rejectedServeLocal('invalid-input');

    const start = snapshotStartLocalInput(selectFields(source, LOCAL_START_KEYS));
    if (!start.ok) return rejectedServeLocal(start.reason);

    return {
      ok: true,
      value: Object.freeze({
        start: start.value,
        displayDir: source.dir as t.StringDir,
        ...(parsed.kind === 'valid' ? { pkgSubpath: parsed.value } : {}),
      }),
    };
  } catch {
    return rejectedServeLocal('invalid-input');
  }
}

function rejectedServe(reason: 'invalid-input' | 'invalid-hostname'): ServePreparation {
  return Object.freeze({ ok: false, reason });
}

function rejectedServeLocal(reason: 'invalid-input' | 'invalid-hostname'): ServeLocalPreparation {
  return Object.freeze({ ok: false, reason });
}
