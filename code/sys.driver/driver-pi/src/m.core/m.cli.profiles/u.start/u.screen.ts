import { c, Cli, Is, pkg, StartGuiIntrinsic, type t } from './common.ts';
import { createOwnedError, ownedError } from './u.error.ts';
import { createPromiseDeferred, observePromiseTransport, pendingPromise } from './u.promise.ts';
import type { BootSafeEvidence, BootState, BootStateSource } from './u.state.ts';
import { captureUrl, stableNativeUrl } from './u.url.ts';

type ScreenSize = t.Cli.Screen.Size;

export type StartGuiScreenInput = {
  readonly service: string;
  readonly url: t.StringUrl;
  readonly state: BootStateSource;
  readonly keyboard: boolean;
  /** Synchronously publishes a screen failure at its package-controlled source. */
  readonly onFailure: (cause: unknown) => void;
};

export type StartGuiScreenInstance = {
  /** Exact result of the synchronous presentation acquisition transaction. */
  readonly kind: 'acquired' | 'failed' | 'unavailable';
  /** Rejects for acquisition or later repaint failure without losing cleanup authority. */
  readonly failure: Promise<never>;
  readonly warnOpen: () => void;
  /** Retryable release; completed subresources are never disposed twice. */
  readonly dispose: () => void;
};

export type StartGuiScreenDependencies = {
  readonly isInteractive: () => boolean;
  readonly size: () => unknown;
  readonly observeResize: (handler: (size: unknown) => void) => () => void;
  readonly repaint: (frame: string) => void;
};

const apply = Reflect.apply;
const freeze = Object.freeze;
const getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
const getPrototypeOf = Object.getPrototypeOf;
const NativeMath = Math;
const NativeNumber = Number;
const mathFloor = NativeMath.floor;
const mathMax = NativeMath.max;
const numberIsFinite = NativeNumber.isFinite;
const objectPrototype = Object.prototype;
const ownKeys = Reflect.ownKeys;
const MAX_SCREEN_DIMENSION = 65_535;
const PRESENTATION_AUTHORITIES = freeze([
  prototypeAuthority(String.prototype, 'charCodeAt'),
  prototypeAuthority(String.prototype, 'endsWith'),
  prototypeAuthority(String.prototype, 'includes'),
  prototypeAuthority(String.prototype, 'indexOf'),
  prototypeAuthority(String.prototype, 'padEnd'),
  prototypeAuthority(String.prototype, 'repeat'),
  prototypeAuthority(String.prototype, 'replace'),
  prototypeAuthority(String.prototype, 'slice'),
  prototypeAuthority(String.prototype, 'split'),
  prototypeAuthority(String.prototype, 'startsWith'),
  prototypeAuthority(String.prototype, 'trim'),
  prototypeAuthority(String.prototype, 'trimEnd'),
  prototypeAuthority(String.prototype, Symbol.iterator),
  prototypeAuthority(Array.prototype, 'filter'),
  prototypeAuthority(Array.prototype, 'find'),
  prototypeAuthority(Array.prototype, 'join'),
  prototypeAuthority(Array.prototype, 'map'),
  prototypeAuthority(Array.prototype, 'push'),
  prototypeAuthority(Array.prototype, 'reduce'),
  prototypeAuthority(Array.prototype, 'slice'),
  prototypeAuthority(Array.prototype, 'some'),
  prototypeAuthority(Array.prototype, Symbol.iterator),
  prototypeAuthority(Set.prototype, 'add'),
  prototypeAuthority(Set.prototype, 'has'),
  prototypeAuthority(Set.prototype, Symbol.iterator),
  prototypeAuthority(RegExp.prototype, 'exec'),
  prototypeAuthority(RegExp.prototype, 'test'),
  prototypeAuthority(RegExp.prototype, Symbol.match),
  prototypeAuthority(RegExp.prototype, Symbol.replace),
  prototypeAuthority(NativeMath, 'floor'),
  prototypeAuthority(NativeMath, 'max'),
  prototypeAuthority(NativeMath, 'min'),
  prototypeAuthority(NativeNumber, 'isFinite'),
]);
const DEFAULT_DEPS: StartGuiScreenDependencies = freeze({
  isInteractive: () => Cli.Is.interactive(),
  size: () => Cli.Screen.size(),
  observeResize: (handler) => observeResizeWith(Cli.Screen.events, handler),
  repaint: (frame) => Cli.Screen.repaint(frame),
});

/** Observe terminal resize events with an explicit event-source dependency. */
export function observeResizeWith(
  createEvents: typeof Cli.Screen.events,
  handler: (size: unknown) => void,
): () => void {
  let events: unknown;
  try {
    events = createEvents();
  } catch {
    throw partialResizeFailure(unresolvedCleanup(createEvents));
  }

  const disposeEvents = descriptorMethod(events, 'dispose');
  const releaseEvents = disposeEvents
    ? () => apply(disposeEvents, events, [])
    : unresolvedCleanup(events);
  if (!disposeEvents) throw partialResizeFailure(retryableCleanup([releaseEvents]));

  const resize = descriptorValue(events, 'resize$');
  const subscribe = descriptorMethod(resize, 'subscribe');
  if (resize === undefined || !subscribe) {
    failResizeAcquisition(retryableCleanup([releaseEvents]));
  }

  let subscription: unknown;
  try {
    subscription = apply(subscribe, resize, [
      (event: t.Cli.Screen.SizeChanged) => handler(snapshotResizeAfter(event)),
    ]);
  } catch {
    failResizeAcquisition(retryableCleanup([releaseEvents]));
  }

  const unsubscribe = descriptorMethod(subscription, 'unsubscribe');
  if (!unsubscribe) failResizeAcquisition(retryableCleanup([releaseEvents]));
  return retryableCleanup([
    () => apply(unsubscribe, subscription, []),
    releaseEvents,
  ]);
}

/** Responsive terminal owner for the direct Pi GUI host. */
export const StartGuiScreen = {
  create(
    input: StartGuiScreenInput,
    overrides: Partial<StartGuiScreenDependencies> = {},
  ): StartGuiScreenInstance {
    const deps = { ...DEFAULT_DEPS, ...overrides };
    if (!deps.isInteractive()) {
      return freeze({
        kind: 'unavailable',
        failure: pendingPromise<never>(),
        warnOpen() {},
        dispose() {},
      });
    }

    const failure = createPromiseDeferred<never>();
    observePromiseTransport<never, void>(failure.promise, {
      fulfilled() {},
      rejected() {},
    });
    let active = true;
    let acquired = false;
    let observed = false;
    let failureSettled = false;
    let openWarning = false;
    let viewport: ScreenSize = { width: 0, height: 0 };
    let releaseResize: (() => void) | undefined;
    let releaseState: (() => void) | undefined;

    const release = () => {
      active = false;
      const failures: unknown[] = [];
      if (releaseState) {
        try {
          releaseState();
          releaseState = undefined;
        } catch (cause) {
          StartGuiIntrinsic.arrayPush(failures, cause);
        }
      }
      if (releaseResize) {
        try {
          releaseResize();
          releaseResize = undefined;
        } catch (cause) {
          StartGuiIntrinsic.arrayPush(failures, cause);
        }
      }
      throwCleanupFailures(failures);
    };
    const repaint = () =>
      deps.repaint(StartGuiScreen.toString({
        service: input.service,
        url: input.url,
        state: input.state.current,
        keyboard: input.keyboard,
        openWarning,
        viewport,
      }));
    const fail = (cause: unknown) => {
      if (failureSettled) return;
      failureSettled = true;
      try {
        input.onFailure(ownedError(cause, 'start:gui screen failed.'));
      } catch {
        // The failure promise remains the independently owned fallback observation channel.
      }
      try {
        release();
      } catch {
        // Retryable cleanup authority remains on the returned screen handle.
      }
      failure.reject(createOwnedError('start:gui screen failed.'));
    };

    try {
      releaseState = input.state.subscribe(() => {
        if (!active || !acquired) return;
        try {
          repaint();
        } catch (cause) {
          fail(cause);
        }
      });
      try {
        releaseResize = deps.observeResize((size) => {
          if (!active) return;
          try {
            viewport = normalizeSize(size);
            observed = true;
            if (!acquired) return;
            repaint();
          } catch (cause) {
            fail(cause);
          }
        });
        if (!active) {
          try {
            release();
          } catch {
            // Retryable cleanup authority remains on the returned screen handle.
          }
          throw createOwnedError('start:gui screen failed.');
        }
      } catch (cause) {
        const partial = takePartialResizeFailure(cause);
        if (partial) {
          releaseResize = partial.release;
          throw cause;
        }
        throw cause;
      }
      if (!observed) {
        const measured = deps.size();
        if (!active) throw createOwnedError('start:gui screen failed.');
        const initial = normalizeSize(measured);
        if (!active) throw createOwnedError('start:gui screen failed.');
        if (!observed) {
          viewport = initial;
          observed = true;
        }
      }
      if (!active) throw createOwnedError('start:gui screen failed.');
      repaint();
      if (!active) throw createOwnedError('start:gui screen failed.');
      acquired = true;
    } catch (cause) {
      fail(cause);
    }

    return freeze({
      kind: acquired ? 'acquired' : 'failed',
      failure: failure.promise,
      warnOpen() {
        if (!active || openWarning) return;
        openWarning = true;
        if (!acquired) return;
        try {
          repaint();
        } catch (cause) {
          fail(cause);
        }
      },
      dispose: release,
    });
  },

  toString(input: {
    readonly service: string;
    readonly url: t.StringUrl;
    readonly state: BootState;
    readonly keyboard: boolean;
    readonly openWarning: boolean;
    readonly viewport: ScreenSize;
  }): string {
    const viewport = normalizeSize(input.viewport);
    if (viewport.width === 0 || viewport.height === 0) return '';

    const serviceWidth = numericMax(
      0,
      viewport.width - SERVICE_LEFT_INSET - SERVICE_RIGHT_GUTTER,
    );
    const serviceLabelWidth = Cli.Fmt.Text.Width.measure(' evidence');
    const facts: (readonly [string, ServiceValue])[] = [];
    StartGuiIntrinsic.arrayPush(facts, [
      'service',
      { kind: 'title', text: input.service },
    ]);
    StartGuiIntrinsic.arrayPush(facts, [
      'state',
      { kind: 'state', state: input.state },
    ]);
    if (input.state.kind === 'ready') {
      StartGuiIntrinsic.arrayPush(facts, [
        'app',
        { kind: 'url', text: input.state.origin },
      ]);
    }
    if (input.state.kind === 'failed') {
      StartGuiIntrinsic.arrayPush(facts, [
        'evidence',
        { kind: 'text', text: evidenceText(input.state.safeEvidence) },
      ]);
    }
    if (input.openWarning) {
      StartGuiIntrinsic.arrayPush(facts, [
        'warning',
        { kind: 'text', text: 'browser did not open; use launch URL' },
      ]);
    }
    StartGuiIntrinsic.arrayPush(facts, ['open', { kind: 'url', text: input.url }]);
    const serviceRows = StartGuiIntrinsic.arrayMap(
      facts,
      ([label, value]) =>
        insetServiceRow(
          serviceRow(label, value, serviceWidth, serviceLabelWidth),
          serviceWidth,
        ),
    );
    const rows: string[] = [];
    StartGuiIntrinsic.arrayAppend(
      rows,
      Cli.Fmt.Header.rows({ pkg, width: viewport.width, tone: 'green' }),
    );
    StartGuiIntrinsic.arrayPush(rows, '');
    StartGuiIntrinsic.arrayAppend(rows, serviceRows);
    const capacity = numericMax(0, viewport.height - FRAME_CURSOR_ROWS);
    const candidateControls = input.keyboard ? keyboardRows(viewport.width) : [];
    const controls = rows.length + candidateControls.length <= capacity ? candidateControls : [];
    const available = numericMax(0, capacity - controls.length);
    const visible = StartGuiIntrinsic.arraySlice(rows, 0, available);
    StartGuiIntrinsic.arrayAppend(visible, controls);
    return StartGuiIntrinsic.stringTrimEnd(StartGuiIntrinsic.arrayJoin(
      StartGuiIntrinsic.arrayMap(visible, (row) => fitRow(row, viewport.width)),
      '\n',
    ));
  },
} as const;

/**
 * Helpers:
 */
type ServiceValue =
  | { readonly kind: 'title' | 'text'; readonly text: string }
  | { readonly kind: 'state'; readonly state: BootState }
  | { readonly kind: 'url'; readonly text: t.StringUrl };

const FRAME_CURSOR_ROWS = 1;
const SERVICE_LEFT_INSET = 2;
const SERVICE_RIGHT_GUTTER = 2;
const SERVICE_GAP = '   ';

function insetServiceRow(row: string, width: number) {
  if (width === 0) return '';
  return `${StartGuiIntrinsic.stringRepeat(' ', SERVICE_LEFT_INSET)}${fitRow(row, width)}`;
}

function serviceRow(
  label: string,
  value: ServiceValue,
  width: number,
  labelWidth: number,
) {
  const minValueWidth = 1;
  const reserve = labelWidth + Cli.Fmt.Text.Width.measure(SERVICE_GAP);
  if (reserve + minValueWidth > width) return serviceValue(value, width);

  const labelText = label === 'service' ? label : ` ${label}`;
  const coloredLabel = label === 'service' ? c.green(labelText) : fieldLabelColor(labelText);
  const renderedLabel = Cli.Fmt.Text.Width.padEnd(coloredLabel, labelWidth);
  const valueWidth = Cli.Fmt.Text.Width.fit({ width, reserve, terminal: false });
  return `${renderedLabel}${SERVICE_GAP}${serviceValue(value, valueWidth)}`;
}

function fieldLabelColor(text: string) {
  return c.dim(c.gray(text));
}

function serviceValue(value: ServiceValue, width: number) {
  if (value.kind === 'url') {
    const part = captureServiceUrl(value.text);
    if (!part) return '';
    const href = stableNativeUrl(part.href);
    if (!href) return '';
    const display = fitServiceUrl(part, width);
    return Cli.Fmt.hyperlink(display, href);
  }
  if (value.kind === 'state') {
    return fitValue(stateText(value.state), width, stateColor(value.state));
  }
  return fitValue(value.text, width, c.white);
}

function captureServiceUrl(input: t.StringUrl): t.Cli.Fmt.ServiceUrl.Part | undefined {
  const url = captureUrl(input);
  if (!url) return;
  const origin = `${url.protocol}//${url.host}`;
  const suffix = `${url.pathname}${url.search}${url.hash}` || '/';
  return freeze({
    ok: true,
    href: url.href,
    origin,
    suffix,
    display: `${origin}${suffix}`,
    ...(url.port ? { port: url.port } : {}),
    highlightOrigin: true,
  });
}

function fitServiceUrl(part: t.Cli.Fmt.ServiceUrl.Part, width: number) {
  const origin = formatServiceOrigin(part);
  const formatted = `${origin}${part.suffix === '/' ? c.cyan(part.suffix) : c.gray(part.suffix)}`;
  if (width <= 0) return '';
  if (Cli.Fmt.Text.Width.measure(formatted) <= width) return formatted;

  const originWidth = Cli.Fmt.Text.Width.measure(origin);
  if (originWidth >= width) return ellipsize(formatted, width);

  const suffixWidth = Cli.Fmt.Text.Width.fit({ width, reserve: originWidth, terminal: false });
  const suffix = Cli.Fmt.Text.ellipsize(part.suffix, suffixWidth);
  return `${origin}${c.gray(suffix)}`;
}

function formatServiceOrigin(part: t.Cli.Fmt.ServiceUrl.Part): string {
  if (!part.port) return c.cyan(part.origin);
  const prefix = StartGuiIntrinsic.stringSlice(
    part.origin,
    0,
    part.origin.length - part.port.length,
  );
  return `${c.cyan(prefix)}${c.bold(c.cyan(part.port))}`;
}

function stateColor(state: BootState): (text: string) => string {
  return state.kind === 'failed' ? c.yellow : c.white;
}

function stateText(state: BootState): string {
  switch (state.kind) {
    case 'preparing':
      return 'preparing';
    case 'starting-app-host':
      return 'starting application host';
    case 'ready':
      return 'ready';
    case 'failed':
      return `failed: ${state.category}`;
    case 'stopping':
      return 'stopping';
  }
}

function evidenceText(evidence: BootSafeEvidence): string {
  switch (evidence.kind) {
    case 'configuration':
      return `configuration/${evidence.reason}`;
    case 'identity':
      return 'package identity refused';
    case 'materialization': {
      const parts = [
        evidence.stage,
        evidence.reason,
        `cleanup:${evidence.cleanup}`,
      ];
      if (evidence.publication) {
        StartGuiIntrinsic.arrayPush(parts, `publication:${evidence.publication}`);
      }
      return StartGuiIntrinsic.arrayJoin(parts, ' / ');
    }
    case 'application-host':
      return `application-host/${evidence.reason}`;
    case 'local':
      return `local/${evidence.operation}`;
    case 'cancellation':
      return 'cancelled by trusted launcher';
  }
}

function fitValue(value: string, width: number, color: (text: string) => string) {
  if (width <= 0) return '';
  if (Cli.Fmt.Text.Width.measure(value) <= width) return color(value);
  return Cli.Fmt.Text.ellipsize(value, width, {
    render: ({ head, ellipsis, tail }) => `${color(head)}${c.gray(ellipsis)}${color(tail)}`,
  });
}

function keyboardRows(width: number): readonly string[] {
  const back = `${c.cyan('←')} ${c.gray('+ ctrl')}`;
  const quit = `${c.gray('quit: ctrl +')} ${c.white('c')} ${c.gray('or')} ${c.white('q')}`;
  const backWidth = Cli.Fmt.Text.Width.measure(back);
  const quitWidth = Cli.Fmt.Text.Width.measure(quit);
  const controlsWidth = backWidth + 2 + quitWidth;
  if (controlsWidth > width) return [];

  const gap = StartGuiIntrinsic.stringRepeat(
    ' ',
    numericMax(2, width - backWidth - quitWidth),
  );
  return ['', c.gray(Cli.Fmt.hr({ width, weight: 'dashed' })), `${back}${gap}${quit}`];
}

function fitRow(row: string, width: number) {
  if (Cli.Fmt.Text.Width.measure(row) <= width) return row;
  return ellipsize(row, width);
}

function ellipsize(value: string, width: number) {
  return Cli.Fmt.Text.ellipsize(Cli.stripAnsi(value), width, {
    render: ({ head, ellipsis, tail }) => `${head}${c.gray(ellipsis)}${tail}`,
  });
}

function normalizeSize(size: unknown): ScreenSize {
  assertPresentationAuthority();
  if (!isDirectObject(size)) throw createOwnedError('start:gui screen failed.');

  let keys: readonly PropertyKey[];
  try {
    keys = ownKeys(size);
  } catch {
    throw createOwnedError('start:gui screen failed.');
  }
  if (keys.length !== 2) throw createOwnedError('start:gui screen failed.');

  const width = ownEnumerableData(size, 'width');
  const height = ownEnumerableData(size, 'height');
  if (!isScreenDimension(width) || !isScreenDimension(height)) {
    throw createOwnedError('start:gui screen failed.');
  }
  return freeze({ width: canonicalDimension(width), height: canonicalDimension(height) });
}

function snapshotResizeAfter(event: unknown): unknown {
  if (!isDirectObject(event)) return;
  let keys: readonly PropertyKey[];
  try {
    keys = ownKeys(event);
  } catch {
    return;
  }
  if (keys.length !== 3) return;
  const kind = ownEnumerableData(event, 'kind');
  const before = ownEnumerableData(event, 'before');
  const after = ownEnumerableData(event, 'after');
  if (kind !== 'size:changed' || before === INVALID_DATA || after === INVALID_DATA) return;
  return after;
}

function isDirectObject(input: unknown): input is object {
  if (!Is.object(input) || Is.proxy(input)) return false;
  try {
    return getPrototypeOf(input) === objectPrototype;
  } catch {
    return false;
  }
}

const INVALID_DATA = Symbol('start:gui.invalid-screen-data');

function ownEnumerableData(input: object, key: PropertyKey): unknown {
  try {
    const descriptor = getOwnPropertyDescriptor(input, key);
    return descriptor?.enumerable === true && 'value' in descriptor
      ? descriptor.value
      : INVALID_DATA;
  } catch {
    return INVALID_DATA;
  }
}

function isScreenDimension(input: unknown): input is number {
  return Is.number(input) && numericIsFinite(input) && input >= 0 &&
    input <= MAX_SCREEN_DIMENSION && numericFloor(input) === input;
}

function canonicalDimension(input: number): number {
  return input === 0 ? 0 : input;
}

function numericFloor(value: number): number {
  return apply(mathFloor, NativeMath, [value]) as number;
}

function numericIsFinite(value: number): boolean {
  return apply(numberIsFinite, NativeNumber, [value]) as boolean;
}

function numericMax(left: number, right: number): number {
  return apply(mathMax, NativeMath, [left, right]) as number;
}

type PartialResizeFailure = Readonly<{
  release: () => void;
}>;

const PARTIAL_RESIZE_FAILURES = StartGuiIntrinsic.createWeakMap<
  object,
  PartialResizeFailure
>();

function partialResizeFailure(release: () => void): Error {
  const error = createOwnedError('start:gui screen resize acquisition failed.');
  StartGuiIntrinsic.weakMapSet(PARTIAL_RESIZE_FAILURES, error, { release });
  return error;
}

function takePartialResizeFailure(cause: unknown): PartialResizeFailure | undefined {
  if (!Is.object(cause)) return;
  const failure = StartGuiIntrinsic.weakMapGet(PARTIAL_RESIZE_FAILURES, cause);
  if (failure) StartGuiIntrinsic.weakMapDelete(PARTIAL_RESIZE_FAILURES, cause);
  return failure;
}

function failResizeAcquisition(release: () => void): never {
  try {
    release();
  } catch {
    throw partialResizeFailure(release);
  }
  throw createOwnedError('start:gui screen resize acquisition failed.');
}

function unresolvedCleanup(owner: unknown): () => void {
  return () => {
    void owner;
    throw createOwnedError('start:gui screen cleanup failed.');
  };
}

function descriptorValue(input: unknown, key: PropertyKey): unknown {
  if (!Is.object(input) || Is.proxy(input)) return;
  let target: object | null = input;
  try {
    for (let depth = 0; target && depth < 8; depth += 1) {
      if (Is.proxy(target)) return;
      const descriptor = getOwnPropertyDescriptor(target, key);
      if (descriptor) return 'value' in descriptor ? descriptor.value : undefined;
      target = getPrototypeOf(target);
    }
  } catch {
    return;
  }
}

function descriptorMethod(
  input: unknown,
  key: PropertyKey,
): ((...args: never[]) => unknown) | undefined {
  const value = descriptorValue(input, key);
  return Is.func(value) && !Is.proxy(value) ? value as (...args: never[]) => unknown : undefined;
}

function retryableCleanup(actions: readonly (() => void)[]): () => void {
  const pending: ((() => void) | undefined)[] = StartGuiIntrinsic.arraySlice(actions);
  return () => {
    const failures: unknown[] = [];
    for (let index = 0; index < pending.length; index++) {
      const action = pending[index];
      if (!action) continue;
      try {
        action();
        pending[index] = undefined;
      } catch (cause) {
        StartGuiIntrinsic.arrayPush(failures, cause);
      }
    }
    throwCleanupFailures(failures);
  };
}

function throwCleanupFailures(failures: readonly unknown[]): void {
  if (failures.length > 0) throw createOwnedError('start:gui screen cleanup failed.');
}

function prototypeAuthority(target: object, key: PropertyKey) {
  const descriptor = getOwnPropertyDescriptor(target, key);
  return freeze({
    target,
    key,
    descriptor: descriptor
      ? freeze({
        configurable: descriptor.configurable,
        enumerable: descriptor.enumerable,
        ...('value' in descriptor
          ? { value: descriptor.value, writable: descriptor.writable }
          : { get: descriptor.get, set: descriptor.set }),
      })
      : undefined,
  });
}

function assertPresentationAuthority(): void {
  if (!Cli.Fmt.Text.isReady()) {
    throw createOwnedError('start:gui screen presentation authority unavailable.');
  }
  for (let index = 0; index < PRESENTATION_AUTHORITIES.length; index += 1) {
    const expected = PRESENTATION_AUTHORITIES[index];
    const actual = getOwnPropertyDescriptor(expected.target, expected.key);
    const descriptor = expected.descriptor;
    const same = actual !== undefined && descriptor !== undefined &&
      actual.configurable === descriptor.configurable &&
      actual.enumerable === descriptor.enumerable &&
      ('value' in descriptor
        ? 'value' in actual && actual.value === descriptor.value &&
          actual.writable === descriptor.writable
        : !('value' in actual) && actual.get === descriptor.get && actual.set === descriptor.set);
    if (!same) throw createOwnedError('start:gui screen presentation authority unavailable.');
  }
}
