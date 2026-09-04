/**
 * Shared CLI test fixtures.
 */
import { expect, Fs, Str } from '../../-test.ts';
import { stripAnsi } from '../common.ts';
import { CellCli } from '../mod.ts';

/**
 * Suppress command presentation while preserving the returned CLI result.
 */
export async function silent<T>(fn: () => Promise<T>) {
  const info = console.info;
  console.info = () => undefined;

  try {
    return await fn();
  } finally {
    console.info = info;
  }
}

export type TaskEvent = {
  readonly args: {
    readonly cwd: string;
    readonly paths: { readonly config?: string };
  };
};

type TaskGlobal = typeof globalThis & { __cellCliTaskEvents?: TaskEvent[] };

export function resetTaskEvents() {
  (globalThis as TaskGlobal).__cellCliTaskEvents = [];
}

export function taskEvents(): readonly TaskEvent[] {
  return (globalThis as TaskGlobal).__cellCliTaskEvents ?? [];
}

export function taskSource(exportName: string) {
  return Str.dedent(`
    export const ${exportName} = {
      run(args: unknown) {
        const g = globalThis as unknown as { __cellCliTaskEvents?: unknown[] };
        g.__cellCliTaskEvents ??= [];
        g.__cellCliTaskEvents.push({ args });
        return { ok: true };
      },
    };
  `).trimStart();
}

export function statusServiceSource() {
  return Str.dedent(`
    export const StatusService = {
      start() {
        const root = new URL('../view/', import.meta.url).pathname.replace(/\\/$/, '');
        return {
          finished: Promise.resolve('done'),
          close() {},
          status() {
            return {
              state: 'ready',
              name: 'owner-local-name',
              kind: 'fixture',
              root,
              urls: [
                { href: 'http://127.0.0.1:4321/', label: 'root' },
                { href: 'http://127.0.0.1:4321/view/', label: 'path' },
                { href: 'http://127.0.0.1:4321/payments/', label: 'route.payments' },
              ],
              details: [{ label: 'dist', value: 'dist/' }],
            };
          },
        };
      },
    };
  `).trimStart();
}

export function devServiceSource() {
  return Str.dedent(`
    export const DevService = {
      start() {
        return {
          finished: Promise.resolve('done'),
          close() {},
          status() {
            return { state: 'ready' };
          },
        };
      },
    };
  `).trimStart();
}

export function failingServiceSource() {
  return Str.dedent(`
    export const FailingService = {
      start() {
        throw new Error('Address already in use (os error 48)');
      },
    };
  `).trimStart();
}

export function objectCauseServiceSource() {
  return Str.dedent(`
    export const ObjectCauseService = {
      start() {
        throw new Error('Strict dev port failed', {
          cause: { code: 'EADDRINUSE', port: 1234, cwd: '/tmp/private' },
        });
      },
    };
  `).trimStart();
}

export function addressInUseServiceSource() {
  return Str.dedent(`
    export const AddressInUseService = {
      start() {
        const cause = new Error('Address already in use (os error 48)');
        cause.name = 'AddrInUse';
        throw new Error(
          'WebSocketServer.create: address already in use: 127.0.0.1:5050.',
          { cause },
        );
      },
    };
  `).trimStart();
}

export async function expectCliError(argv: string[], message: string) {
  const res = await silent(() => CellCli.run({ argv }));
  const text = stripAnsi(res.text);

  expect(res.kind).to.eql('error');
  if (res.kind !== 'error') throw new Error('expected error result');
  expect(res.code).to.eql(1);
  expect(text).to.contain(message);
}

export async function read(path: string) {
  const res = await Fs.readText(path);
  if (!res.ok) throw res.error;
  return res.data ?? '';
}
