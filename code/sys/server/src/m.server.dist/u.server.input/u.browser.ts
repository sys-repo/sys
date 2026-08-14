import { Is, Num, Obj, type t } from './common.ts';
import { snapshotRecord } from './u.record.ts';

const POLICY_KEYS = ['kind', 'dedicatedWorkers', 'serviceWorker'] as const;
const SOURCE_KEYS = ['kind', 'path', 'worker'] as const;
const SERVICE_WORKER_KEYS = ['kind', 'path'] as const;

/** Sentinel returned when an explicitly supplied browser policy is malformed. */
export const INVALID_BROWSER_POLICY = Symbol('invalid-browser-policy');

export type BrowserPolicySnapshot = t.DistServer.BrowserPolicy.Input;

/** Snapshot one closed browser-policy input without invoking caller accessors. */
export function snapshotBrowserPolicy(
  input: unknown,
  maxSources: number,
): BrowserPolicySnapshot | typeof INVALID_BROWSER_POLICY | undefined {
  if (input === undefined) return;

  const source = snapshotRecord(input, POLICY_KEYS, POLICY_KEYS);
  if (!source || source.kind !== 'verified-loopback') return INVALID_BROWSER_POLICY;

  const dedicatedWorkers = snapshotDedicatedWorkers(source.dedicatedWorkers, maxSources);
  const serviceWorker = snapshotServiceWorker(source.serviceWorker);
  if (!dedicatedWorkers || !serviceWorker) return INVALID_BROWSER_POLICY;

  return Object.freeze({
    kind: 'verified-loopback',
    dedicatedWorkers,
    serviceWorker,
  });
}

function snapshotDedicatedWorkers(
  input: unknown,
  maxSources: number,
): readonly t.DistServer.BrowserPolicy.DedicatedWorker.Source[] | undefined {
  if (!Is.array(input) || Object.getPrototypeOf(input) !== Array.prototype) return;
  if (!Num.Is.safeInt(maxSources) || maxSources < 0) return;

  const length = input.length;
  if (!Num.Is.safeInt(length) || length > maxSources) return;
  const keys = Reflect.ownKeys(input);
  if (keys.length !== length + 1 || !keys.includes('length')) return;
  const lengthDescriptor = Object.getOwnPropertyDescriptor(input, 'length');
  if (!lengthDescriptor || !Obj.hasOwn(lengthDescriptor, 'value')) return;

  const output: t.DistServer.BrowserPolicy.DedicatedWorker.Source[] = [];
  const assets = new Set<string>();
  const blobs = new Set<string>();
  for (let index = 0; index < length; index++) {
    const key = String(index);
    if (!keys.includes(key)) return;
    const descriptor = Object.getOwnPropertyDescriptor(input, key);
    if (!descriptor || !Obj.hasOwn(descriptor, 'value')) return;

    const source = snapshotDedicatedWorkerSource(descriptor.value);
    if (!source) return;
    if (source.kind === 'blob') {
      if (blobs.has(source.worker)) return;
      blobs.add(source.worker);
    } else {
      if (assets.has(source.path)) return;
      assets.add(source.path);
    }
    output.push(source);
  }
  return Object.freeze(output);
}

function snapshotDedicatedWorkerSource(
  input: unknown,
): t.DistServer.BrowserPolicy.DedicatedWorker.Source | undefined {
  const source = snapshotRecord(input, SOURCE_KEYS, ['kind']);
  if (!source) return;
  if (source.kind === 'blob') {
    if (!canonicalAssetPath(source.worker) || Reflect.ownKeys(source).length !== 2) return;
    return Object.freeze({ kind: 'blob', worker: source.worker });
  }
  if (source.kind !== 'asset' || !canonicalAssetPath(source.path)) return;
  if (Reflect.ownKeys(source).length !== 2) return;
  return Object.freeze({ kind: 'asset', path: source.path });
}

function snapshotServiceWorker(
  input: unknown,
): t.DistServer.BrowserPolicy.ServiceWorker.Admission | undefined {
  const source = snapshotRecord(input, SERVICE_WORKER_KEYS, ['kind']);
  if (!source) return;
  if (source.kind === 'deny') {
    if (Reflect.ownKeys(source).length !== 1) return;
    return Object.freeze({ kind: 'deny' });
  }
  if (source.kind !== 'tombstone' || !canonicalAssetPath(source.path)) return;
  if (Reflect.ownKeys(source).length !== 2) return;
  return Object.freeze({ kind: 'tombstone', path: source.path });
}

function canonicalAssetPath(input: unknown): input is t.Files.String.Path {
  if (!Is.str(input) || input.length === 0 || input.includes('\\') || input.includes('\0')) {
    return false;
  }
  const segments = input.split('/');
  return segments.every((segment) => segment.length > 0 && segment !== '.' && segment !== '..');
}
