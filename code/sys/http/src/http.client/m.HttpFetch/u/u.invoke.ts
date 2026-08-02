import { Err, Is, type t } from '../common.ts';
import { discardHeadBody, readBody } from './u.body.ts';
import { failureResponse, isPolicyFailure, policyFailureResponse } from './u.failure.ts';
import { requestHeaders } from './u.headers.ts';
import {
  inputHref,
  parseUrl,
  resolveRedirect,
  safeHref,
  type ValidatedPolicy,
  validateInit,
} from './u.input.ts';
import { CANCELLED, createOperation } from './u.operation.ts';

const REDIRECT_STATUS = new Set([301, 302, 303, 307, 308]);

type InvokeArgs<T> = {
  readonly contentType: t.StringContentType;
  readonly contentTypePolicy: t.HttpFetch.CreateOptions['contentTypePolicy'];
  readonly method: 'GET' | 'HEAD';
  readonly input: t.FetchInput;
  readonly init: t.HttpFetch.Init;
  readonly options: t.HttpFetch.Options;
  readonly policy?: ValidatedPolicy;
  readonly externalSignal: AbortSignal;
  readonly defaultHeaders: () => Headers;
  readonly decode: (bytes: Uint8Array<ArrayBuffer>, response: Response) => Promise<T>;
  readonly checksumSource: 'bytes' | 'value';
};

/** Execute one bounded Fetch request. */
export async function invokeFetch<T>(args: InvokeArgs<T>): Promise<t.HttpFetch.Response<T>> {
  const method = args.method;
  const href = inputHref(args.input);
  const safeUrl = safeHref(href);

  if (args.externalSignal.aborted) {
    return failureResponse({
      method,
      safeUrl,
      status: 499,
      statusText: 'Fetch operation cancelled before completing',
      headers: new Headers(),
      cause: Err.std('Fetch operation cancelled before completing', { name: 'HttpError' }),
    });
  }

  const policy = args.policy;
  if (!policy) return policyFailureResponse(method, safeUrl, 'invalid-policy');
  if (!validateInit(args.init) || !Is.record(args.options)) {
    return policyFailureResponse(method, safeUrl, 'invalid-request');
  }

  let onProgress: t.HttpFetch.ResponsePolicy.ProgressHandler | undefined;
  let expectedChecksum: t.StringHash | undefined;
  try {
    onProgress = args.options.onProgress;
    expectedChecksum = args.options.checksum;
  } catch {
    return policyFailureResponse(method, safeUrl, 'invalid-request');
  }
  if (onProgress !== undefined && !Is.func(onProgress)) {
    return policyFailureResponse(method, safeUrl, 'invalid-request');
  }
  if (expectedChecksum !== undefined && !Is.str(expectedChecksum)) {
    return policyFailureResponse(method, safeUrl, 'invalid-request');
  }

  if (!href) return policyFailureResponse(method, safeUrl, 'invalid-url');
  const requested = parseUrl(href);
  if (!requested) return policyFailureResponse(method, safeUrl, 'invalid-url');
  if (!policy.sourceOrigins.has(requested.origin)) {
    return policyFailureResponse(method, safeUrl, 'source-denied');
  }

  const requestedUrl = requested.href;
  const operation = createOperation(args.externalSignal, policy.timeout);
  let responseReceived = false;
  let responseHeaders = new Headers();

  try {
    operation.throwIfStopped();
    const authoritativeHeaders = requestHeaders({
      contentType: args.contentType,
      contentTypePolicy: args.contentTypePolicy,
      init: args.init,
      defaults: args.defaultHeaders,
    });
    let current = requested;
    let redirects = 0;
    const visited = new Set<string>([current.href]);

    while (true) {
      operation.throwIfStopped();
      const headers = policy.credentialOrigins.has(current.origin)
        ? new Headers(authoritativeHeaders)
        : new Headers();

      responseReceived = false;
      responseHeaders = new Headers();
      const request = fetch(current.href, {
        ...args.init,
        method,
        body: undefined,
        headers,
        signal: operation.signal,
        redirect: 'manual',
        credentials: 'omit',
        referrer: '',
        referrerPolicy: 'no-referrer',
      });
      const response = await operation.raceFetch(request);
      operation.throwIfStopped();
      responseReceived = true;
      responseHeaders = response.headers;

      if (REDIRECT_STATUS.has(response.status)) {
        const location = response.headers.get('location');
        await operation.cancelResponse(response);
        operation.throwIfStopped();

        const next = resolveRedirect(current, location) ?? operation.fail('redirect-invalid');
        if (!policy.sourceOrigins.has(next.origin)) operation.fail('source-denied');
        if (current.protocol === 'https:' && next.protocol === 'http:') {
          operation.fail('redirect-downgrade');
        }
        if (visited.has(next.href)) operation.fail('redirect-loop');
        if (redirects >= policy.maxRedirects) operation.fail('redirect-limit');

        redirects++;
        visited.add(next.href);
        current = next;
        continue;
      }

      if (!response.ok) {
        await operation.cancelResponse(response);
        operation.throwIfStopped();
        const statusText = response.statusText;
        const message = `${response.status} ${statusText || 'HTTP Error'}`;
        return failureResponse({
          method,
          safeUrl,
          status: response.status,
          statusText,
          headers: response.headers,
          cause: Err.std(message, { name: 'HttpError' }),
        });
      }

      const bytes = method === 'HEAD'
        ? await discardHeadBody(response, operation)
        : await readBody({
          operation,
          response,
          policy,
          requestedUrl,
          finalUrl: current.href,
          onProgress,
        });
      operation.throwIfStopped();

      const data = await operation.race(args.decode(bytes, response));
      operation.throwIfStopped();

      let checksum: t.HttpFetch.ResponseChecksum | undefined;
      if (expectedChecksum) {
        const errors = Err.errors();
        const module = await operation.race(import('./u.checksum.ts'));
        operation.throwIfStopped();
        const input = args.checksumSource === 'bytes' ? bytes : data;
        checksum = module.verifyChecksum(input, expectedChecksum, errors);
        operation.throwIfStopped();

        if (!checksum.valid) {
          const cause = errors.toError() ?? Err.std('Checksum verification failed');
          return failureResponse({
            method,
            safeUrl,
            status: 412,
            statusText: 'Pre-condition failed (checksum-mismatch)',
            headers: response.headers,
            checksum,
            cause,
          });
        }
      }

      return {
        ok: true,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data,
        error: undefined,
        checksum,
        requestedUrl,
        finalUrl: current.href,
      };
    }
  } catch {
    const terminal = operation.terminal;
    if (terminal === CANCELLED) {
      return failureResponse({
        method,
        safeUrl,
        status: 499,
        statusText: 'Fetch operation cancelled before completing',
        headers: responseHeaders,
        cause: Err.std('Fetch operation cancelled before completing', { name: 'HttpError' }),
      });
    }

    if (isPolicyFailure(terminal)) {
      return policyFailureResponse(method, safeUrl, terminal.policyFailure);
    }

    const stage = responseReceived ? 'decoding response' : 'fetching';
    return failureResponse({
      method,
      safeUrl,
      status: 520,
      statusText: 'HTTP Client Error',
      headers: responseHeaders,
      cause: Err.std(`Failed while ${stage}: ${safeUrl}`, { name: 'HttpError' }),
    });
  } finally {
    operation.dispose();
  }
}
