import { Arr, Fs, Is, type t } from '../common.ts';
import {
  failureRecord,
  filesystemEvidence,
  RESOURCE_FAILURE,
  type ResourceFailure,
} from './u.failure.ts';
import type { ResourceSnapshot } from './u.snapshot.ts';

export type PreparedResource = ResourceSnapshot & {
  readonly target: {
    readonly input: t.StringRelativePath;
    readonly path: t.StringRelativePath;
    readonly handle: Parameters<t.FsRooted.Instance['publishFile']>[0];
  };
};

export type AdmissionResult =
  | { readonly ok: true; readonly resources: readonly PreparedResource[] }
  | {
    readonly ok: false;
    readonly failure: ResourceFailure;
    readonly records: readonly t.HttpPull.ResourceRecordFailure[];
  };

/** Admit every target together before transport or publication begins. */
export async function admitResources(
  resources: readonly ResourceSnapshot[],
  rooted: t.FsRooted.Instance,
  signal: AbortSignal,
): Promise<AdmissionResult> {
  try {
    const admission = await rooted.admit(
      resources.map((resource) => ({ kind: 'file' as const, path: resource.target.input })),
      { until: signal },
    );
    if (!Arr.isArray(admission.targets) || admission.targets.length !== resources.length) {
      return admissionFailure(resources, RESOURCE_FAILURE.admission);
    }

    const prepared: PreparedResource[] = [];
    for (let index = 0; index < resources.length; index++) {
      const resource = resources[index];
      const handle = admission.targets[index];
      if (!Is.object(handle) || handle.kind !== 'file' || !Is.str(handle.path)) {
        return admissionFailure(resources, RESOURCE_FAILURE.admission);
      }
      prepared.push(Object.freeze({
        ...resource,
        target: Object.freeze({
          input: resource.target.input,
          path: handle.path,
          handle,
        }),
      }));
    }
    return { ok: true, resources: Object.freeze(prepared) };
  } catch (cause) {
    const filesystem = Fs.Capability.Rooted.Is.failure(cause)
      ? filesystemEvidence(cause)
      : undefined;
    return admissionFailure(resources, { ...RESOURCE_FAILURE.admission, filesystem });
  }
}

function admissionFailure(
  resources: readonly ResourceSnapshot[],
  failure: ResourceFailure,
): Extract<AdmissionResult, { readonly ok: false }> {
  return {
    ok: false,
    failure,
    records: Object.freeze(resources.map((resource) => failureRecord(resource, failure))),
  };
}
