import { expect, Is, Json, type t } from '../../-test.ts';

export type FixtureName = 'fixture.echo' | 'fixture.fail' | 'fixture.emit' | 'fixture.ctx';

export type FixturePayload = {
  readonly 'fixture.echo': { readonly text: string; readonly suffix?: string };
  readonly 'fixture.fail': { readonly message: string };
  readonly 'fixture.emit': { readonly text: string };
  readonly 'fixture.ctx': Record<string, never>;
};

export type FixtureResult = {
  readonly 'fixture.echo': { readonly text: string };
  readonly 'fixture.fail': Record<string, never>;
  readonly 'fixture.emit': { readonly ok: true };
  readonly 'fixture.ctx': {
    readonly id: t.Cmd.ReqId;
    readonly name: 'fixture.ctx';
    readonly ns?: t.Cmd.Namespace;
    readonly aborted: boolean;
  };
};

export type FixtureEvent = {
  readonly 'fixture.echo': never;
  readonly 'fixture.fail': never;
  readonly 'fixture.emit': { readonly text: string };
  readonly 'fixture.ctx': never;
};

export type FixtureOptions = t.HttpCmd.HandlerOptions<
  FixtureName,
  FixturePayload,
  FixtureResult,
  FixtureEvent
>;

export const NS = 'fixture.http.cmd' as t.Cmd.Namespace;
export const URL = 'https://example.test/api/cmd' as t.StringUrl;
export const PATH = '/api/cmd' as t.StringUrlRoute;

export function options(input: Partial<FixtureOptions> = {}): FixtureOptions {
  return {
    path: PATH,
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

export async function expectCmdError(
  fn: () => Promise<unknown>,
  name: t.Cmd.Error.Kind,
): Promise<t.Cmd.Error.Instance> {
  try {
    await fn();
  } catch (error) {
    expect(error).to.be.instanceOf(Error);
    const err = error as t.Cmd.Error.Instance;
    expect(err.name).to.eql(name);
    return err;
  }
  throw new Error(`Expected ${name}.`);
}

export function abortableFetch(): {
  readonly fetch: t.Fetch;
  readonly aborted: Promise<unknown>;
} {
  let resolveAbort: (reason: unknown) => void = () => undefined;
  const aborted = new Promise<unknown>((resolve) => {
    resolveAbort = resolve;
  });

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
