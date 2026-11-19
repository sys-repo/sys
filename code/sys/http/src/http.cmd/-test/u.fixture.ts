import { expect, Is, Json, type t } from '../../-test.ts';
import type {
  FixtureEvent,
  FixtureName,
  FixtureOptions,
  FixturePayload,
  FixtureResult,
} from './t.ts';

export const POLICY = { maxBytes: { request: 1024, response: 4096 }, timeout: 1_000 } as const;
export const NS: t.Cmd.Namespace = 'fixture.http.cmd';
export const URL: t.StringUrl = 'https://example.test/api/cmd';
export const PATH: t.StringUrlRoute = '/api/cmd';

export function options(input: Partial<FixtureOptions> = {}): FixtureOptions {
  return {
    path: PATH,
    policy: POLICY,
    cmd: { ns: NS, handlers: handlers() },
    ...input,
  };
}

export function optionsWithoutCtxHandler(): FixtureOptions {
  const all = handlers();
  return options({
    cmd: {
      ns: NS,
      handlers: {
        'fixture.echo': all['fixture.echo'],
        'fixture.fail': all['fixture.fail'],
        'fixture.emit': all['fixture.emit'],
      } as t.Cmd.Handler.Map<FixtureName, FixturePayload, FixtureResult, FixtureEvent>,
    },
  });
}

export function handlers(): t.Cmd.Handler.Map<
  FixtureName,
  FixturePayload,
  FixtureResult,
  FixtureEvent
> {
  return {
    'fixture.echo': (payload) => ({ text: `${payload.text}${payload.suffix ?? ''}` }),
    'fixture.fail': (payload) => {
      throw new Error(payload.message);
    },
    'fixture.emit': (payload, ctx) => {
      ctx.emit({ text: payload.text });
      return { ok: true };
    },
    'fixture.ctx': (_payload, ctx) => ({
      id: ctx.id,
      name: ctx.name,
      ns: ctx.ns,
      aborted: ctx.signal.aborted,
    }),
  };
}

export function request(
  input: Partial<t.Cmd.Wire.Request> = {},
  options: { readonly url?: string; readonly method?: string; readonly body?: unknown } = {},
): Request {
  const body = options.body ?? {
    kind: 'cmd',
    id: 'req-fixture',
    ns: NS,
    name: 'fixture.echo',
    payload: { text: 'hello' },
    ...input,
  };

  const method = options.method ?? 'POST';
  const canSendBody = method !== 'GET' && method !== 'HEAD';

  return new Request(options.url ?? URL, {
    method,
    headers: { 'content-type': 'application/json' },
    body: canSendBody ? (Is.string(body) ? body : Json.stringify(body)) : undefined,
  });
}

export async function result(response: Response): Promise<t.Cmd.Wire.Result> {
  return (await response.json()) as t.Cmd.Wire.Result;
}

export const fetchFor = (handler: t.HttpCmd.RequestHandler): t.Fetch => {
  return async (input, init) => await handler(new Request(input, init));
};

export async function expectFailure(
  fn: () => Promise<unknown>,
  kind: t.HttpCmd.FailureKind,
  dispatch: t.HttpCmd.Error['dispatch'] = 'possible',
): Promise<t.HttpCmd.Error> {
  try {
    await fn();
  } catch (error) {
    expect(error).to.be.instanceOf(Error);
    const err = error as t.HttpCmd.Error;
    expect(err.name).to.eql('HttpCmdError');
    expect(err.kind).to.eql(kind);
    expect(err.dispatch).to.eql(dispatch);
    expect(err.message).to.eql(`HTTP command failed: ${kind}.`);
    expect(Object.isFrozen(err)).to.eql(true);
    expect(Object.getOwnPropertyNames(err).sort()).to.eql([
      'dispatch',
      'kind',
      'message',
      'name',
      ...(err.status === undefined ? [] : ['status']),
    ].sort());
    return err;
  }
  throw new Error(`Expected ${kind}.`);
}

export function abortableFetch(): {
  readonly fetch: t.Fetch;
  readonly aborted: Promise<unknown>;
} {
  const { promise: aborted, resolve: resolveAbort } = Promise.withResolvers<unknown>();

  const fetch: t.Fetch = (_input, init) => {
    const signal = init?.signal;
    return new Promise<Response>((_resolve, reject) => {
      const abort = () => {
        resolveAbort(signal?.reason);
        reject(signal?.reason ?? new Error('aborted'));
      };

      if (signal?.aborted) abort();
      else signal?.addEventListener('abort', abort, { once: true });
    });
  };

  return { fetch, aborted };
}
