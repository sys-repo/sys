import { Is, Rx, Schedule, type t, toHeaders } from '../common.ts';
import { policyFailureResponse } from './u.failure.ts';
import { defaultHeaders } from './u.headers.ts';
import { inputHref, safeHref, validateResponsePolicy } from './u.input.ts';
import { invokeFetch } from './u.invoke.ts';
import { composeSignals } from './u.signal.ts';

type F = t.HttpFetch.Lib['make'];

/** Create one bounded Fetch capability. */
export const makeFetch: F = (input: Parameters<F>[0]) => {
  type Snapshot = Omit<t.HttpFetch.CreateOptions, 'policy'> & {
    readonly policy?: t.HttpFetch.ResponsePolicy;
  };
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
  let life: ReturnType<typeof Rx.abortable>;
  try {
    life = Rx.abortable(createOptions.until);
  } catch {
    policy = undefined;
    life = Rx.abortable();
  }

  const invoke = async <T>(args: {
    readonly contentType: t.StringContentType;
    readonly method: 'GET' | 'HEAD';
    readonly input: t.FetchInput;
    readonly init: t.HttpFetch.Init;
    readonly options: t.HttpFetch.Options;
    readonly decode: (bytes: Uint8Array<ArrayBuffer>, response: Response) => Promise<T>;
    readonly checksumSource: 'bytes' | 'value';
  }): Promise<t.HttpFetch.Response<T>> => {
    // Rx bridges a pre-aborted lifecycle signal on a microtask; latch it before network work.
    await Schedule.micro();
    let callerSignal: AbortSignal | undefined;
    try {
      callerSignal = args.init.signal ?? undefined;
    } catch {
      return policyFailureResponse(args.method, safeHref(inputHref(args.input)), 'invalid-request');
    }
    let request: ReturnType<typeof composeSignals>;
    try {
      request = composeSignals(life.signal, callerSignal);
    } catch {
      return policyFailureResponse(args.method, safeHref(inputHref(args.input)), 'invalid-request');
    }
    try {
      return await invokeFetch({
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
};

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
