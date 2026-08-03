import { Arr, Is, Num, Obj, Pkg, type t } from '../common.ts';
import { failureRecord, RESOURCE_FAILURE, type ResourceFailure } from './u.resource.failure.ts';
import { parseResourceSource, safeResourceSource } from './u.resource.source.ts';

export type SourceSnapshot = {
  readonly input: t.StringUrl;
  readonly href: t.StringUrl;
  readonly safe: t.StringUrl;
};

export type ResourceSnapshot = {
  readonly index: t.Index;
  readonly source: SourceSnapshot;
  readonly target: { readonly input: t.StringRelativePath };
  readonly checksum: t.StringHash;
  readonly expectedBytes?: t.NumberBytes;
};

type SnapshotOptions = {
  readonly sourceOrigins: ReadonlySet<string>;
  readonly maxFileBytes: t.NumberBytes;
  readonly maxTotalBytes: t.NumberBytes;
};

export type SnapshotResult =
  | { readonly ok: true; readonly resources: readonly ResourceSnapshot[] }
  | {
    readonly ok: false;
    readonly resources: readonly ResourceSnapshot[];
    readonly failure: ResourceFailure;
    readonly records: readonly t.HttpPull.ResourceRecordFailure[];
  };

const RESOURCE_KEYS = ['source', 'target', 'checksum', 'expectedBytes'] as const;

/** Snapshot and validate a complete bounded checksum-pinned resource batch. */
export function snapshotResources(input: unknown, options: SnapshotOptions): SnapshotResult {
  if (!Arr.isArray(input)) return snapshotFailure([], RESOURCE_FAILURE.input);

  let length = 0;
  try {
    length = input.length;
  } catch {
    return snapshotFailure([], RESOURCE_FAILURE.input);
  }

  const resources: ResourceSnapshot[] = [];
  let failure: ResourceFailure | undefined;
  let expectedTotal = 0;

  for (let index = 0; index < length; index++) {
    let source = '';
    let target = '';
    let checksum = '';
    let expectedBytes: unknown;

    try {
      const value = input[index];
      if (!Is.record(value)) {
        failure ??= RESOURCE_FAILURE.resource;
      } else {
        const keys = Obj.keys(value);
        if (keys.some((key) => !RESOURCE_KEYS.includes(key as typeof RESOURCE_KEYS[number]))) {
          failure ??= RESOURCE_FAILURE.resource;
        }

        const sourceValue = Obj.hasOwn(value, 'source') ? value.source : undefined;
        const targetValue = Obj.hasOwn(value, 'target') ? value.target : undefined;
        const checksumValue = Obj.hasOwn(value, 'checksum') ? value.checksum : undefined;
        const sizeValue = Obj.hasOwn(value, 'expectedBytes') ? value.expectedBytes : undefined;

        if (sourceValue === undefined || targetValue === undefined || checksumValue === undefined) {
          failure ??= RESOURCE_FAILURE.resource;
        }
        source = Is.str(sourceValue) ? sourceValue : '';
        target = Is.str(targetValue) ? targetValue : '';
        checksum = Is.str(checksumValue) ? checksumValue : '';
        expectedBytes = sizeValue;
      }
    } catch {
      failure ??= RESOURCE_FAILURE.resource;
    }

    const parsedSource = parseResourceSource(source);
    if (!parsedSource || !options.sourceOrigins.has(parsedSource.origin)) {
      failure ??= RESOURCE_FAILURE.source;
    }

    const parsedChecksum = Pkg.Dist.Part.parse(checksum);
    if (!parsedChecksum || parsedChecksum.hash !== checksum || parsedChecksum.size !== undefined) {
      failure ??= RESOURCE_FAILURE.resource;
    }

    if (expectedBytes !== undefined && (!Num.Is.safeInt(expectedBytes) || expectedBytes < 0)) {
      failure ??= RESOURCE_FAILURE.resource;
    }

    if (Num.Is.safeInt(expectedBytes) && expectedBytes >= 0) {
      if (expectedBytes > options.maxFileBytes) failure ??= RESOURCE_FAILURE.file;
      if (expectedBytes > options.maxTotalBytes - expectedTotal) {
        failure ??= RESOURCE_FAILURE.aggregate;
      } else {
        expectedTotal += expectedBytes;
      }
    }

    const href = parsedSource?.href ?? '';
    resources.push(Object.freeze({
      index: index as t.Index,
      source: Object.freeze({ input: source, href, safe: safeResourceSource(href) }),
      target: Object.freeze({ input: target }),
      checksum,
      ...(Num.Is.safeInt(expectedBytes) && expectedBytes >= 0
        ? { expectedBytes: expectedBytes as t.NumberBytes }
        : {}),
    }));
  }

  const frozen = Object.freeze(resources);
  return failure ? snapshotFailure(frozen, failure) : { ok: true, resources: frozen };
}

function snapshotFailure(
  resources: readonly ResourceSnapshot[],
  failure: ResourceFailure,
): Extract<SnapshotResult, { readonly ok: false }> {
  return {
    ok: false,
    resources,
    failure,
    records: Object.freeze(resources.map((resource) => failureRecord(resource, failure))),
  };
}
