import { Is, Rx, Schedule, type t, toHeaders } from '../common.ts';
import type { InvokeFetchArgs, MakeFetchDependencies, SignalComposition } from './t.ts';
import { policyFailureResponse } from './u.failure.ts';
import { defaultHeaders } from './u.headers.ts';
import { inputHref, safeHref, validateResponsePolicy } from './u.input.ts';
import { invokeFetch } from './u.invoke.ts';
import { composeSignals } from './u.signal.ts';

type F = t.HttpFetch.Lib['make'];

type Snapshot = Omit<t.HttpFetch.CreateOptions, 'policy'> & {
  readonly policy?: t.HttpFetch.ResponsePolicy;
};

type RequestArgs<T> = Omit<
  InvokeFetchArgs<T>,
  'contentTypePolicy' | 'policy' | 'externalSignal' | 'defaultHeaders'
>;

const DEFAULT_DEPS: MakeFetchDependencies = { invoke: invokeFetch };

/** Create one bounded Fetch capability. */
export const makeFetch: F = (input) => makeFetchWith(DEFAULT_DEPS, input);

/** Package-internal bounded Fetch construction seam. */
export function makeFetchWith(
  deps: MakeFetchDependencies,
  input: t.HttpFetch.CreateOptions,
): t.HttpFetch.Instance {
  let createOptions: Snapshot = {};
  let optionsValid = false;

  try {
    if (Is.record(input)) {
      const options = input as t.HttpFetch.CreateOptions;
      createOptions = {
        policy: options.policy,
        headers: options.headers,
        accessToken: options.accessToken,
        until: options.until,
        contentTypePolicy: options.contentTypePolicy,
      };
      optionsValid = isCreateOptions(createOptions);
    }
  } catch {
    // A hostile options getter is an invalid construction snapshot.
  }

  const validated = optionsValid
    ? validateResponsePolicy(createOptions.policy)
    : { ok: false as const };
  let policy = validated.ok ? validated.value : undefined;
  let life: t.Abortable;
  try {
    life = Rx.abortable(createOptions.until);
  } catch {
    policy = undefined;
    life = Rx.abortable();
  }

  const invoke = async <T>(args: RequestArgs<T>): Promise<t.HttpFetch.Response<T>> => {
    // Rx bridges a pre-aborted lifecycle signal on a microtask; latch it before network work.
    await Schedule.micro();
    const request = requestSignals(life.signal, args.init);
    if (!request) {
      return policyFailureResponse(args.method, safeHref(inputHref(args.input)), 'invalid-request');
    }
    try {
      return await deps.invoke({
        ...args,
        contentTypePolicy: createOptions.contentTypePolicy,
        policy,
        externalSignal: request.signal ?? life.signal,
        defaultHeaders: () => defaultHeaders(createOptions),
      });
    } finally {
      request.dispose();
    }
  };

  const head: t.HttpFetch.Instance['head'] = (input, init = {}) => {
    return invoke({
      contentType: '',
      method: 'HEAD',
      input,
      init,
      options: {},
      decode: () => Promise.resolve(undefined),
      checksumSource: 'value',
    });
  };

  function json<T>(
    input: t.FetchInput,
    init: t.HttpFetch.Init = {},
    options: t.HttpFetch.Options = {},
  ): Promise<t.HttpFetch.Response<T>> {
    const decode = (bytes: Uint8Array<ArrayBuffer>, response: Response) =>
      new Response(bytes, { headers: response.headers }).json() as Promise<T>;
    return invoke({
      contentType: 'application/json',
      method: 'GET',
      input,
      init,
      options,
      decode,
      checksumSource: 'value',
    });
  }

  const text: t.HttpFetch.Instance['text'] = (input, init = {}, options = {}) => {
    const decode = (bytes: Uint8Array<ArrayBuffer>, response: Response) =>
      new Response(bytes, { headers: response.headers }).text();
    return invoke({
      contentType: 'text/plain',
      method: 'GET',
      input,
      init,
      options,
      decode,
      checksumSource: 'value',
    });
  };

  const blob: t.HttpFetch.Instance['blob'] = (input, init = {}, options = {}) => {
    const decode = (bytes: Uint8Array<ArrayBuffer>, response: Response) =>
      new Response(bytes, { headers: response.headers }).blob();
    return invoke({
      contentType: 'application/octet-stream',
      method: 'GET',
      input,
      init,
      options,
      decode,
      checksumSource: 'bytes',
    });
  };

  return Rx.toLifecycle<t.HttpFetch.Instance>(life, {
    header: (name) => defaultHeaders(createOptions).get(name) ?? undefined,
    get headers() {
      return toHeaders(defaultHeaders(createOptions));
    },
    head,
    json,
    text,
    blob,
  });
}

/**
 * Helpers:
 */
function requestSignals(
  parent: AbortSignal,
  init: t.HttpFetch.Init,
): SignalComposition | undefined {
  try {
    return composeSignals(parent, init.signal ?? undefined);
  } catch {
    // Signal access and composition share the request-admission failure boundary.
    return;
  }
}

function isCreateOptions(input: Omit<t.HttpFetch.CreateOptions, 'policy'>): boolean {
  const { accessToken, contentTypePolicy, headers, until } = input;
  if (headers !== undefined && !Is.func(headers)) return false;
  if (accessToken !== undefined && !Is.str(accessToken) && !Is.func(accessToken)) return false;
  if (
    contentTypePolicy !== undefined &&
    contentTypePolicy !== 'corsSafe' &&
    contentTypePolicy !== 'always'
  ) return false;
  return Is.untilInput(until);
}
