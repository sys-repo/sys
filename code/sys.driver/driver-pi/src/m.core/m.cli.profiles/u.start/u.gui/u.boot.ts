import { StartGuiIntrinsic, type t } from '../common.ts';

import type { AuthoritySnapshot } from '../u.authority.ts';
import type { Started, StartGuiDependencies } from '../u.deps.ts';
import { captureFailure, type FailureOperation } from '../u.failure.ts';
import type { Supervisor, WorkAdmission } from '../u.lifecycle/mod.ts';
import { materialize, prepareReleaseOwner } from '../u.materialize.ts';
import { LIMITS } from '../u.limits.ts';
import { Boot, type BootState, type BootStateOwner } from '../u.state.ts';
import { captureFileHref } from '../u.url.ts';
import { VERIFIED_LOOPBACK_BROWSER_POLICY } from '../u.browser.ts';
import type { BootResult, Observed } from './t.ts';
import {
  assertPromiseTransportReady,
  awaitPromise,
  beginAdmission,
  beginCheckpoint,
  bootResultOf,
  observeMaterialization,
  observeOperation,
  READY_RESULT,
  resultAfterObservedFailure,
} from './u.operation.ts';

const AUTHORITY_OPERATION: FailureOperation = 'authority';
const RELEASE_OWNER_OPERATION: FailureOperation = 'release-owner';
const APPLICATION_HOST_OPERATION: FailureOperation = 'application-host';

type BootInput = Readonly<{
  root: t.StringDir;
  authorityEvidence: AuthoritySnapshot;
  state: BootStateOwner;
  supervisor: Supervisor;
  deps: StartGuiDependencies;
}>;

type Authority = Extract<AuthoritySnapshot, { kind: 'valid' }>['authority'];
type ReleaseAuthority = Extract<Authority, { kind: 'release' }>;
type ReleaseOwner = Awaited<ReturnType<typeof prepareReleaseOwner>>;
type ReleaseOwnerObservation = Promise<Observed<ReleaseOwner>>;
type MaterializationObservation = ReturnType<typeof observeMaterialization>;
type ApplicationOwner = ReturnType<Supervisor['setApplication']>;
type ApplicationObservation = Promise<Observed<ApplicationOwner>>;

export async function runBoot(input: BootInput): Promise<BootResult> {
  assertPromiseTransportReady();
  let operation = AUTHORITY_OPERATION;
  try {
    const authorityAdmission = await beginAuthorityAdmission(input);
    if (authorityAdmission.kind === 'blocked') return bootResultOf(authorityAdmission.event);

    const authorityResult = authorityAdmission.value;
    if (authorityResult.kind === 'invalid') throw authorityResult.error;
    const authority = authorityResult.authority;

    let dir: t.StringAbsoluteDir;
    if (authority.kind === 'release') {
      operation = RELEASE_OWNER_OPERATION;
      const ownerAdmission = await beginReleaseOwnerAdmission(input);
      if (ownerAdmission.kind === 'blocked') return bootResultOf(ownerAdmission.event);

      const ownerResult = await awaitPromise(ownerAdmission.value);
      if (ownerResult.kind === 'failed') return resultAfterObservedFailure(input.supervisor);
      const owner = ownerResult.value;

      const materializationAdmission = await beginMaterializationAdmission(
        input,
        authority,
        owner,
      );
      if (materializationAdmission.kind === 'blocked') {
        return bootResultOf(materializationAdmission.event);
      }

      const materialization = await awaitPromise(materializationAdmission.value);
      if (materialization.kind === 'failed') return resultAfterObservedFailure(input.supervisor);
      dir = materialization.value.dir;
    } else {
      dir = authority.dir;
    }
    const directoryHref = captureFileHref(dir);

    operation = APPLICATION_HOST_OPERATION;
    const startingAdmission = await beginStateAdmission(input, Boot.startingAppHost);
    if (startingAdmission.kind === 'blocked') return bootResultOf(startingAdmission.event);

    const applicationAdmission = await beginApplicationAdmission(input, authority, dir);
    if (applicationAdmission.kind === 'blocked') {
      return bootResultOf(applicationAdmission.event);
    }

    const application = await awaitPromise(applicationAdmission.value);
    if (application.kind === 'failed') return resultAfterObservedFailure(input.supervisor);

    const readyState = Boot.ready(
      application.value.origin,
      application.value.digest,
      directoryHref,
    );
    const readyAdmission = await beginStateAdmission(input, readyState);
    if (readyAdmission.kind === 'blocked') return bootResultOf(readyAdmission.event);

    await beginCheckpoint(input.supervisor);
    const afterReady = input.supervisor.currentBlocker;
    return afterReady ? bootResultOf(afterReady) : READY_RESULT;
  } catch (cause) {
    const failure = captureFailure(cause, operation);
    input.supervisor.publishFailure(failure.error, failure.state);
    return resultAfterObservedFailure(input.supervisor);
  }
}

function beginAuthorityAdmission(input: BootInput): Promise<WorkAdmission<AuthoritySnapshot>> {
  const readEvidence = () => input.authorityEvidence;
  return beginAdmission(input.supervisor, readEvidence);
}

function beginReleaseOwnerAdmission(
  input: BootInput,
): Promise<WorkAdmission<ReleaseOwnerObservation>> {
  const prepareOwner = () => observeReleaseOwner(input);
  return beginAdmission(input.supervisor, prepareOwner);
}

function observeReleaseOwner(input: BootInput): ReleaseOwnerObservation {
  const { deps, root, supervisor } = input;
  const invoke = () => prepareReleaseOwner({ root, deps, until: supervisor.signal });
  const admit = (owner: ReleaseOwner) => {
    supervisor.setLease(owner.lease);
    return owner;
  };
  return observeOperation({
    invoke,
    operation: RELEASE_OWNER_OPERATION,
    supervisor,
    admit,
  });
}

function beginMaterializationAdmission(
  input: BootInput,
  authority: ReleaseAuthority,
  owner: ReleaseOwner,
): Promise<WorkAdmission<MaterializationObservation>> {
  const materializeRelease = () => observeReleaseMaterialization(input, authority, owner);
  return beginAdmission(input.supervisor, materializeRelease);
}

function observeReleaseMaterialization(
  input: BootInput,
  authority: ReleaseAuthority,
  owner: ReleaseOwner,
): MaterializationObservation {
  const invoke = () =>
    materialize({
      owner,
      source: authority.source,
      integrity: authority.integrity,
      deps: input.deps,
      until: input.supervisor.signal,
    });
  return observeMaterialization({
    invoke,
    expected: authority.expectedPkg,
    diagnostics: authority.diagnostics,
    supervisor: input.supervisor,
    operation: RELEASE_OWNER_OPERATION,
  });
}

function beginStateAdmission(
  input: BootInput,
  state: BootState,
): Promise<WorkAdmission<void>> {
  const publishState = () => input.state.set(state);
  return beginAdmission(input.supervisor, publishState);
}

function beginApplicationAdmission(
  input: BootInput,
  authority: Authority,
  dir: t.StringAbsoluteDir,
): Promise<WorkAdmission<ApplicationObservation>> {
  const startApplication = () => observeApplication(input, authority, dir);
  return beginAdmission(input.supervisor, startApplication);
}

function observeApplication(
  input: BootInput,
  authority: Authority,
  dir: t.StringAbsoluteDir,
): ApplicationObservation {
  const { deps, supervisor } = input;
  const invoke = () =>
    deps.start({
      dir,
      integrity: authority.integrity,
      limits: LIMITS,
      hostname: '127.0.0.1',
      port: 0,
      browserPolicy: VERIFIED_LOOPBACK_BROWSER_POLICY,
      silent: true,
      until: supervisor.signal,
    });
  const admit = (started: Started) =>
    supervisor.setApplication(
      started,
      StartGuiIntrinsic.freeze({
        integrity: authority.integrity,
        expectedPkg: authority.expectedPkg,
        ...(authority.kind === 'release' ? { diagnostics: authority.diagnostics } : {}),
      }),
    );
  return observeOperation({
    invoke,
    operation: APPLICATION_HOST_OPERATION,
    supervisor,
    admit,
    unobservableResource: 'application-host',
  });
}
