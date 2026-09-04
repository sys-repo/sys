import { Fs, Schedule, type t } from '../common.ts';

import type { AuthoritySnapshot } from '../u.authority.ts';
import type { StartGuiDependencies } from '../u.deps.ts';
import { type FailureOperation, generationOpenError } from '../u.failure.ts';
import { admitApplicationPkg, admitGenerationPkg } from '../u.identity/mod.ts';
import { LIMITS } from '../u.limits.ts';
import { materializePolicy } from '../u.source.ts';
import { Boot, type BootStateOwner } from '../u.state.ts';
import { captureFileHref } from '../u.url.ts';
import { VERIFIED_LOOPBACK_BROWSER_POLICY } from '../u.browser.ts';
import { START_GUI_SERVICE } from '../../u/u.start.gui.service.ts';

export type BootResources = {
  generation?: t.Dist.Generation.Owner;
  application?: t.DistServer.Started;
};

type FailurePublisher = (cause: unknown, operation: FailureOperation) => void;

type BootInput = Readonly<{
  root: t.StringDir;
  authorityEvidence: AuthoritySnapshot;
  state: BootStateOwner;
  signal: AbortSignal;
  deps: StartGuiDependencies;
  resources: BootResources;
  onApplication: (owner: t.DistServer.Started) => void;
  publishFailure: FailurePublisher;
  publishObservedFailure: FailurePublisher;
}>;

type Authority = Extract<AuthoritySnapshot, { kind: 'valid' }>['authority'];
type ReleaseAuthority = Extract<Authority, { kind: 'release' }>;
type Application = ReturnType<typeof admitApplicationPkg>;

/** Acquire and verify the application resources selected by Driver Pi policy. */
export async function runBoot(input: BootInput): Promise<void> {
  let operation: FailureOperation = 'authority';
  try {
    if (input.authorityEvidence.kind === 'invalid') throw input.authorityEvidence.error;
    const authority = input.authorityEvidence.authority;

    operation = 'release-owner';
    const dir = authority.kind === 'release' ? await openRelease(input, authority) : authority.dir;
    if (!dir) return;
    assertActive(input.signal);

    input.state.set(Boot.startingAppHost);
    await Schedule.micro();
    assertActive(input.signal);

    operation = 'application-host';
    const application = await startApplication(input, authority, dir);
    if (!application) return;

    await Schedule.micro();
    assertActive(input.signal);
    input.state.set(Boot.ready(application.origin, application.digest, captureFileHref(dir)));
  } catch (cause) {
    input.publishFailure(cause, operation);
  }
}

async function openRelease(
  input: BootInput,
  authority: ReleaseAuthority,
): Promise<t.StringAbsoluteDir | undefined> {
  let task: Promise<t.Dist.Generation.Open.Result>;
  try {
    task = input.deps.openGeneration(Object.freeze({
      store: releaseStore(input.root),
      manifestUrl: authority.source.href,
      integrity: authority.integrity,
      policy: materializePolicy(authority.source),
      until: input.signal,
    }));
  } catch (cause) {
    input.publishFailure(cause, 'release-owner');
    return;
  }

  let opening: t.Dist.Generation.Open.Result;
  try {
    opening = await task;
  } catch (cause) {
    input.publishObservedFailure(cause, 'release-owner');
    return;
  }

  try {
    if (opening.kind === 'failed') throw generationOpenError(opening);

    // Driver Pi owns the returned Generation before applying its package policy.
    input.resources.generation = opening.owner;
    return admitGenerationPkg({
      expected: authority.expectedPkg,
      generation: opening.generation,
      diagnostics: authority.diagnostics,
    });
  } catch (cause) {
    input.publishObservedFailure(cause, 'release-owner');
  }
}

async function startApplication(
  input: BootInput,
  authority: Authority,
  dir: t.StringAbsoluteDir,
): Promise<Application | undefined> {
  let task: Promise<t.DistServer.Started>;
  try {
    task = input.deps.start({
      dir,
      integrity: authority.integrity,
      limits: LIMITS,
      hostname: '127.0.0.1',
      port: 0,
      browserPolicy: VERIFIED_LOOPBACK_BROWSER_POLICY,
      silent: true,
      until: input.signal,
    });
  } catch (cause) {
    input.publishFailure(cause, 'application-host');
    return;
  }

  let started: t.DistServer.Started;
  try {
    started = await task;
  } catch (cause) {
    input.publishObservedFailure(cause, 'application-host');
    return;
  }

  try {
    input.onApplication(started);
    return admitApplicationPkg(started, {
      expectedPkg: authority.expectedPkg,
      ...(authority.kind === 'release' ? { diagnostics: authority.diagnostics } : {}),
    });
  } catch (cause) {
    input.publishObservedFailure(cause, 'application-host');
  }
}

function releaseStore(root: t.StringDir): t.Dist.Generation.Store.Input {
  return Object.freeze({
    root: Fs.join(root, START_GUI_SERVICE.store.root) as t.StringAbsoluteDir,
    target: START_GUI_SERVICE.store.target,
  });
}

function assertActive(signal: AbortSignal): void {
  if (signal.aborted) throw new Error('start:gui startup cancelled.');
}
