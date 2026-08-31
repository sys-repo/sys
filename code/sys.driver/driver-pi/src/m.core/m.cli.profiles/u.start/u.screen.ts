import { c, Cli, Fs, HashFmt, Is, pkg, StartGuiIntrinsic, type t } from './common.ts';
import { allowsBack } from '../u/u.start.gui.settlement.ts';
import { START_GUI_SERVICE, type StartGuiRecoveryPolicy } from '../u/u.start.gui.service.ts';
import { createOwnedError, ownedError } from './u.error.ts';
import { createPromiseDeferred, observePromiseTransport, pendingPromise } from './u.promise.ts';
import type { BootSafeEvidence, BootState, BootStateSource } from './u.state.ts';
import { captureFileHref, captureUrl, stableNativeUrl } from './u.url.ts';

type ScreenSize = t.Cli.Screen.Size;
type CapturedRootLink = Readonly<{
  readonly text: t.StringAbsoluteDir;
  readonly url: URL;
}>;
type RootLinkInput = t.StringAbsoluteDir | CapturedRootLink;

export type StartGuiScreenInput = {
  readonly service: string;
  readonly url: t.StringUrl;
  /** Exact development generation hosted by this session; omitted for release acquisition. */
  readonly root?: t.StringAbsoluteDir;
  /** Exact admitted release-manifest location associated with the verified Dist digest. */
  readonly manifestUrl?: t.StringUrl;
  /** Package-owned policy available only for the canonical local evidence source. */
  readonly recovery?: StartGuiRecoveryPolicy;
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
  /** Remeasure and repaint the current authoritative screen state. */
  readonly redraw: () => void;
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
const isAbsolutePath = Fs.Path.Is.absolute;
const NativeMath = Math;
const NativeNumber = Number;
const mathFloor = NativeMath.floor;
const mathMax = NativeMath.max;
const numberIsFinite = NativeNumber.isFinite;
const objectPrototype = Object.prototype;
const ownKeys = Reflect.ownKeys;
const ROOT_LINKS = StartGuiIntrinsic.createWeakSet<object>();
const stringTrim = String.prototype.trim;
const MAX_SCREEN_DIMENSION = 65_535;
const PRESENTATION_AUTHORITIES = freeze([
  prototypeAuthority(String.prototype, 'charCodeAt'),
  prototypeAuthority(String.prototype, 'endsWith'),
  prototypeAuthority(String.prototype, 'includes'),
  prototypeAuthority(String.prototype, 'indexOf'),
  prototypeAuthority(String.prototype, 'lastIndexOf'),
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
  prototypeAuthority(Array, 'isArray'),
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
    const root = captureRootLink(input.root);
    const manifestUrl = captureManifestUrl(input.manifestUrl);
    const recovery = input.recovery === START_GUI_SERVICE.recovery ? input.recovery : undefined;
    const deps = { ...DEFAULT_DEPS, ...overrides };
    if (!deps.isInteractive()) {
      return freeze({
        kind: 'unavailable',
        failure: pendingPromise<never>(),
        redraw() {},
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
    let redrawing = false;
    let resizeRevision = 0;
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
        root,
        manifestUrl,
        recovery,
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
        if (!active || !acquired || redrawing) return;
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
            resizeRevision += 1;
            if (!acquired || redrawing) return;
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
      redraw() {
        if (!active || !acquired || redrawing) return;
        const revision = resizeRevision;
        redrawing = true;
        try {
          const measured = normalizeSize(deps.size());
          if (!active || !acquired) return;
          if (resizeRevision === revision) viewport = measured;
          repaint();
        } catch (cause) {
          fail(cause);
        } finally {
          redrawing = false;
        }
      },
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
    readonly root?: RootLinkInput;
    readonly manifestUrl?: t.StringUrl;
    readonly recovery?: StartGuiRecoveryPolicy;
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
      const manifestUrl = captureManifestUrl(input.manifestUrl);
      StartGuiIntrinsic.arrayPush(facts, [
        'manifest',
        {
          kind: 'manifest',
          hash: input.state.digest,
          ...(input.state.directoryHref === undefined
            ? {}
            : { directoryHref: input.state.directoryHref }),
          ...(manifestUrl === undefined ? {} : { href: manifestUrl }),
        },
      ]);
    }
    const root = capturedRootLink(input.root);
    if (root) {
      StartGuiIntrinsic.arrayPush(facts, [
        'root',
        { kind: 'path', root },
      ]);
    }
    if (input.state.kind === 'failed') {
      StartGuiIntrinsic.arrayPush(facts, [
        'evidence',
        { kind: 'evidence', items: evidenceItems(input.state.safeEvidence) },
      ]);
      const manifestChecksum = manifestChecksumOf(input.state.safeEvidence);
      if (manifestChecksum) {
        StartGuiIntrinsic.arrayPush(facts, [
          'expected',
          { kind: 'checksum', text: manifestChecksum.expected },
        ]);
        StartGuiIntrinsic.arrayPush(facts, [
          'received',
          { kind: 'checksum', text: manifestChecksum.received },
        ]);
      }
      const guidance = failureGuidance(input.state, input.recovery);
      if (guidance) {
        StartGuiIntrinsic.arrayPush(facts, ['guidance', { kind: 'title', text: guidance }]);
      }
    }
    if (input.openWarning) {
      StartGuiIntrinsic.arrayPush(facts, [
        'warning',
        { kind: 'warning', text: 'browser did not open; use launch URL' },
      ]);
    }
    StartGuiIntrinsic.arrayPush(facts, ['open', { kind: 'capability', text: input.url }]);
    if (input.state.kind === 'ready') {
      StartGuiIntrinsic.arrayPush(facts, [
        'app',
        { kind: 'url', text: input.state.origin },
      ]);
    }
    const serviceRows: string[] = [];
    for (const [label, value] of facts) {
      const rendered = StartGuiIntrinsic.arrayMap(
        serviceRow(label, value, serviceWidth, serviceLabelWidth),
        (row) => insetServiceRow(row, serviceWidth),
      );
      StartGuiIntrinsic.arrayAppend(serviceRows, rendered);
    }
    const rows: string[] = [];
    StartGuiIntrinsic.arrayAppend(
      rows,
      Cli.Fmt.Header.rows({ pkg, width: viewport.width, tone: 'green' }),
    );
    StartGuiIntrinsic.arrayPush(rows, '');
    StartGuiIntrinsic.arrayAppend(rows, serviceRows);
    const capacity = numericMax(0, viewport.height - FRAME_CURSOR_ROWS);
    const footer = input.keyboard ? keyboardRows(viewport.width, allowsBack(input.state)) : [];
    const visible = Cli.Screen.Dock.bottom({ capacity, flow: rows, footer });
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
  | { readonly kind: 'title' | 'warning'; readonly text: string }
  | { readonly kind: 'checksum'; readonly text: t.StringHash }
  | { readonly kind: 'evidence'; readonly items: readonly string[] }
  | {
    readonly kind: 'manifest';
    readonly hash: t.StringHash;
    readonly directoryHref?: t.StringUrl;
    readonly href?: t.StringUrl;
  }
  | { readonly kind: 'capability'; readonly text: t.StringUrl }
  | { readonly kind: 'path'; readonly root: CapturedRootLink }
  | { readonly kind: 'state'; readonly state: BootState }
  | { readonly kind: 'url'; readonly text: t.StringUrl };

type SingleLineServiceValue = Exclude<ServiceValue, { readonly kind: 'evidence' }>;

const FRAME_CURSOR_ROWS = 1;
const SERVICE_LEFT_INSET = 2;
const SERVICE_RIGHT_GUTTER = 2;
const SERVICE_GAP = '   ';
const CAPABILITY_HINT = '(capability)';
const DIST_PATH = 'dist/';

function insetServiceRow(row: string, width: number) {
  if (width === 0) return '';
  return `${StartGuiIntrinsic.stringRepeat(' ', SERVICE_LEFT_INSET)}${fitRow(row, width)}`;
}

function serviceRow(
  label: string,
  value: ServiceValue,
  width: number,
  labelWidth: number,
): readonly string[] {
  const minValueWidth = 1;
  const reserve = labelWidth + Cli.Fmt.Text.Width.measure(SERVICE_GAP);
  const valueWidth = reserve + minValueWidth > width
    ? width
    : Cli.Fmt.Text.Width.fit({ width, reserve, terminal: false });
  const valueRows = serviceValueRows(value, valueWidth);
  if (reserve + minValueWidth > width) return valueRows;

  const labelText = label === 'service' ? label : ` ${label}`;
  const coloredLabel = label === 'service' ? c.green(labelText) : fieldLabelColor(labelText);
  const renderedLabel = Cli.Fmt.Text.Width.padEnd(coloredLabel, labelWidth);
  const continuation = StartGuiIntrinsic.stringRepeat(' ', reserve);
  return StartGuiIntrinsic.arrayMap(valueRows, (row, index) => {
    return index === 0 ? `${renderedLabel}${SERVICE_GAP}${row}` : `${continuation}${row}`;
  });
}

function fieldLabelColor(text: string) {
  return c.dim(c.gray(text));
}

function serviceValueRows(value: ServiceValue, width: number): readonly string[] {
  if (value.kind === 'evidence') return evidenceRows(value.items, width);
  return [serviceValue(value, width)];
}

function serviceValue(value: SingleLineServiceValue, width: number) {
  if (value.kind === 'path') {
    if (width <= 0) return '';
    const display = Cli.Fmt.Path.tty(value.root.text, {
      fit: 'width',
      min: 1,
      terminal: true,
      width,
    });
    return Cli.Fmt.hyperlink(display, value.root.url);
  }
  if (value.kind === 'url' || value.kind === 'capability') {
    const part = captureServiceUrl(value.text);
    if (!part) return '';
    const href = stableNativeUrl(part.href);
    if (!href) return '';
    const origin = formatServiceOrigin(part);
    const full = formatServiceUrl(part, origin);
    if (
      value.kind === 'capability' &&
      Cli.Fmt.Text.Width.measure(`${full} ${CAPABILITY_HINT}`) <= width
    ) {
      return `${Cli.Fmt.hyperlink(full, href)} ${fieldLabelColor(CAPABILITY_HINT)}`;
    }
    return Cli.Fmt.hyperlink(fitServiceUrl(part, width, origin), href);
  }
  if (value.kind === 'state') {
    return fitValue(stateText(value.state), width, stateColor(value.state));
  }
  if (value.kind === 'manifest') {
    const reserve = Cli.Fmt.Text.Width.measure(`${DIST_PATH} `);
    const manifestUrl = value.href === undefined ? undefined : stableNativeUrl(value.href);
    const directoryUrl = value.directoryHref === undefined
      ? undefined
      : stableNativeUrl(value.directoryHref);
    const directory = fitValue(DIST_PATH, width, c.gray);
    const linkedDirectory = directory && directoryUrl
      ? Cli.Fmt.hyperlink(directory, directoryUrl)
      : directory;
    const digest = HashFmt.digest(value.hash, {
      arrow: true,
      maxWidth: numericMax(0, width - reserve),
      url: manifestUrl,
    });
    return digest ? `${linkedDirectory} ${digest}` : linkedDirectory;
  }
  if (value.kind === 'checksum') return fitValue(value.text, width, c.gray);
  if (value.kind === 'warning') return fitValue(value.text, width, c.yellow);
  return fitValue(value.text, width, c.white);
}

function capturedRootLink(input: unknown): CapturedRootLink | undefined {
  if (Is.object(input) && StartGuiIntrinsic.weakSetHas(ROOT_LINKS, input)) {
    return input as CapturedRootLink;
  }
  return captureRootLink(input);
}

function captureRootLink(input: unknown): CapturedRootLink | undefined {
  const text = captureDisplayRoot(input);
  if (!text) return;
  try {
    const href = captureFileHref(text);
    if (!href) return;
    const url = stableNativeUrl(href);
    if (!url) return;
    const root = freeze({ text, url });
    StartGuiIntrinsic.weakSetAdd(ROOT_LINKS, root);
    return root;
  } catch {
    return;
  }
}

function captureDisplayRoot(input: unknown): t.StringAbsoluteDir | undefined {
  if (
    !Is.string(input) || apply(stringTrim, input, []) !== input ||
    !apply(isAbsolutePath, undefined, [input])
  ) return;
  for (let index = 0; index < input.length; index += 1) {
    const first = StartGuiIntrinsic.stringCharCodeAt(input, index);
    if (first <= 0x1f || (first >= 0x7f && first <= 0x9f)) return;
    if (first === 0x2028 || first === 0x2029) return;

    let codePoint = first;
    if (first >= 0xd800 && first <= 0xdbff) {
      if (index + 1 >= input.length) return;
      const second = StartGuiIntrinsic.stringCharCodeAt(input, index + 1);
      if (second < 0xdc00 || second > 0xdfff) return;
      codePoint = 0x10000 + ((first - 0xd800) * 0x400) + (second - 0xdc00);
      index += 1;
    } else if (first >= 0xdc00 && first <= 0xdfff) {
      return;
    }
    if (isUnicodeFormatControl(codePoint)) return;
  }
  return input as t.StringAbsoluteDir;
}

function isUnicodeFormatControl(code: number): boolean {
  return code === 0x00ad ||
    (code >= 0x0600 && code <= 0x0605) || code === 0x061c || code === 0x06dd ||
    code === 0x070f || (code >= 0x0890 && code <= 0x0891) || code === 0x08e2 ||
    code === 0x180e || (code >= 0x200b && code <= 0x200f) ||
    (code >= 0x202a && code <= 0x202e) || (code >= 0x2060 && code <= 0x2064) ||
    (code >= 0x2066 && code <= 0x206f) || code === 0xfeff ||
    (code >= 0xfff9 && code <= 0xfffb) || code === 0x110bd || code === 0x110cd ||
    (code >= 0x13430 && code <= 0x1343f) || (code >= 0x1bca0 && code <= 0x1bca3) ||
    (code >= 0x1d173 && code <= 0x1d17a) || code === 0xe0001 ||
    (code >= 0xe0020 && code <= 0xe007f);
}

function captureManifestUrl(input: unknown): t.StringUrl | undefined {
  if (!Is.string(input)) return;
  const url = captureUrl(input);
  if (
    !url || (url.protocol !== 'http:' && url.protocol !== 'https:') || url.username ||
    url.password || url.search || url.hash
  ) return;
  return url.href;
}

function captureServiceUrl(input: t.StringUrl): t.Cli.Fmt.ServiceUrl.Part | undefined {
  const url = captureUrl(input);
  if (!url) return;
  const hostname = Cli.Fmt.ServiceUrl.displayHostname(url.hostname);
  const host = url.port ? `${hostname}:${url.port}` : hostname;
  const origin = `${url.protocol}//${host}`;
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

function formatServiceUrl(part: t.Cli.Fmt.ServiceUrl.Part, origin: string) {
  return `${origin}${part.suffix === '/' ? c.cyan(part.suffix) : c.gray(part.suffix)}`;
}

function fitServiceUrl(part: t.Cli.Fmt.ServiceUrl.Part, width: number, origin: string) {
  const formatted = formatServiceUrl(part, origin);
  if (width <= 0) return '';
  if (Cli.Fmt.Text.Width.measure(formatted) <= width) return formatted;

  const originWidth = Cli.Fmt.Text.Width.measure(origin);
  if (originWidth >= width) return ellipsize(formatted, width);

  const suffixWidth = Cli.Fmt.Text.Width.fit({ width, reserve: originWidth, terminal: false });
  const suffix = Cli.Fmt.Text.ellipsize(part.suffix, suffixWidth, {
    render: ({ head, ellipsis, tail }) => {
      return `${c.gray(head)}${Cli.Fmt.omission(ellipsis)}${c.gray(tail)}`;
    },
  });
  return `${origin}${suffix}`;
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
  return state.kind === 'failed' ? c.yellow : c.gray;
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

function failureGuidance(
  state: Extract<BootState, { readonly kind: 'failed' }>,
  recovery?: StartGuiRecoveryPolicy,
): string | undefined {
  if (
    recovery === START_GUI_SERVICE.recovery && manifestChecksumOf(state.safeEvidence)
  ) return recovery.manifestChecksumMismatch;
  if (state.category === 'repair-required') {
    return 'The cache was refused and retained. Run deno task reset, then launch a fresh session.';
  }
  if (state.category === 'source-unavailable') {
    return 'Check access to the configured source, then launch a fresh session.';
  }
}

function manifestChecksumOf(
  evidence: BootSafeEvidence,
): t.Dist.ManifestChecksumMismatch | undefined {
  return evidence.kind === 'materialization' && evidence.stage === 'manifest-fetch' &&
      evidence.reason === 'integrity-mismatch'
    ? evidence.manifestChecksum
    : undefined;
}

function evidenceItems(evidence: BootSafeEvidence): readonly string[] {
  switch (evidence.kind) {
    case 'configuration':
      return [`configuration/${evidence.reason}`];
    case 'identity':
      return ['package identity refused'];
    case 'materialization': {
      const items = [
        evidence.stage,
        evidence.reason,
        `cleanup:${evidence.cleanup}`,
      ];
      if (evidence.publication) {
        StartGuiIntrinsic.arrayPush(items, `publication:${evidence.publication}`);
      }
      return items;
    }
    case 'application-host':
      return [`application-host/${evidence.reason}`];
    case 'local':
      return [`local/${evidence.operation}`];
    case 'cancellation':
      return ['cancelled by trusted launcher'];
  }
}

function evidenceRows(items: readonly string[], width: number): readonly string[] {
  const separator = ' · ';
  const rows: string[] = [];
  let current = '';

  for (const item of items) {
    const candidate = current ? `${current}${separator}${item}` : item;
    if (current && Cli.Fmt.Text.Width.measure(candidate) > width) {
      StartGuiIntrinsic.arrayPush(rows, colorEvidence(current));
      current = item;
    } else {
      current = candidate;
    }
  }
  if (current) StartGuiIntrinsic.arrayPush(rows, colorEvidence(current));
  return rows.length > 0 ? rows : [''];
}

function fitValue(value: string, width: number, color: (text: string) => string) {
  if (width <= 0) return '';
  if (Cli.Fmt.Text.Width.measure(value) <= width) return color(value);
  return Cli.Fmt.Text.ellipsize(value, width, {
    render: ({ head, ellipsis, tail }) => {
      return `${color(head)}${Cli.Fmt.omission(ellipsis)}${color(tail)}`;
    },
  });
}

function colorEvidence(value: string) {
  const output: string[] = [];
  let remaining = value;
  while (true) {
    // Captured positional scanning keeps presentation independent of mutable string methods.
    const separatorIndex = StartGuiIntrinsic.stringIndexOf(remaining, '·');
    if (separatorIndex < 0) {
      StartGuiIntrinsic.arrayPush(output, c.gray(remaining));
      break;
    }
    StartGuiIntrinsic.arrayPush(
      output,
      c.gray(StartGuiIntrinsic.stringSlice(remaining, 0, separatorIndex)),
    );
    StartGuiIntrinsic.arrayPush(output, c.gray('·'));
    remaining = StartGuiIntrinsic.stringSlice(remaining, separatorIndex + 1);
  }
  return StartGuiIntrinsic.arrayJoin(output, '');
}

function keyboardRows(width: number, backEnabled: boolean): readonly string[] {
  const quit = Cli.Fmt.Keyboard.command({ label: 'quit', keys: ['q'] });
  const row = Cli.Fmt.Keyboard.row({
    width,
    candidates: backEnabled
      ? [{ left: `${c.cyan('←')} ${c.gray('ctrl')}`, right: quit }]
      : [{ right: quit }],
  });
  return row ? [c.gray(Cli.Fmt.hr({ width, weight: 'dashed' })), row] : [];
}

function fitRow(row: string, width: number) {
  if (Cli.Fmt.Text.Width.measure(row) <= width) return row;
  return ellipsize(row, width);
}

function ellipsize(value: string, width: number) {
  return Cli.Fmt.Text.ellipsize(Cli.stripAnsi(value), width, {
    render: ({ head, ellipsis, tail }) => `${head}${Cli.Fmt.omission(ellipsis)}${tail}`,
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
  if (!Is.object(input) || Is.Native.proxy(input)) return false;
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
  if (!Is.object(input) || Is.Native.proxy(input)) return;
  let target: object | null = input;
  try {
    for (let depth = 0; target && depth < 8; depth += 1) {
      if (Is.Native.proxy(target)) return;
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
  return Is.func(value) && !Is.Native.proxy(value)
    ? value as (...args: never[]) => unknown
    : undefined;
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
