import { c, Cli, HashFmt, type t } from '../common.ts';

import { START_GUI_SERVICE, type StartGuiRecoveryPolicy } from '../../u/u.start.gui.service.ts';
import type { BootSafeEvidence, BootState } from '../u.state.ts';
import { stableNativeUrl } from '../u.url.ts';
import { capturedRootLink, captureManifestUrl, captureServiceUrl, numericMax } from './u.input.ts';
import type { CapturedRootLink, StartGuiScreenRenderInput } from './t.ts';

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
type ServiceFact = readonly [label: string, value: ServiceValue];

const SERVICE_LEFT_INSET = 2;
const SERVICE_RIGHT_GUTTER = 2;
const SERVICE_GAP = '   ';
const CAPABILITY_HINT = '(capability)';
const DIST_PATH = 'dist/';

/** Render the complete service-fact region for one admitted screen state. */
export function renderServiceRows(
  input: StartGuiScreenRenderInput,
  frameWidth: number,
): readonly string[] {
  const width = numericMax(0, frameWidth - SERVICE_LEFT_INSET - SERVICE_RIGHT_GUTTER);
  const labelWidth = Cli.Fmt.Text.Width.measure(' evidence');
  const rows: string[] = [];

  for (const [label, value] of serviceFacts(input)) {
    const rendered = serviceRow(label, value, width, labelWidth).map((row) =>
      insetServiceRow(row, width)
    );
    rows.push(...rendered);
  }
  return rows;
}

/** Fit one terminal row without retaining partial ANSI styling. */
export function fitTerminalRow(row: string, width: number) {
  if (Cli.Fmt.Text.Width.measure(row) <= width) return row;
  return ellipsize(row, width);
}

function serviceFacts(input: StartGuiScreenRenderInput): readonly ServiceFact[] {
  const facts: ServiceFact[] = [];
  pushFact(facts, 'service', { kind: 'title', text: input.service });
  pushFact(facts, 'state', { kind: 'state', state: input.state });

  if (input.state.kind === 'ready') {
    pushFact(facts, 'manifest', {
      kind: 'manifest',
      hash: input.state.digest,
      directoryHref: input.state.directoryHref,
      href: captureManifestUrl(input.manifestUrl),
    });
  }

  const root = capturedRootLink(input.root);
  if (root) pushFact(facts, 'root', { kind: 'path', root });

  if (input.state.kind === 'failed') {
    pushFact(facts, 'evidence', {
      kind: 'evidence',
      items: evidenceItems(input.state.safeEvidence),
    });
    const manifestChecksum = manifestChecksumOf(input.state.safeEvidence);
    if (manifestChecksum) {
      pushFact(facts, 'expected', { kind: 'checksum', text: manifestChecksum.expected });
      pushFact(facts, 'received', { kind: 'checksum', text: manifestChecksum.received });
    }
    const guidance = failureGuidance(input.state, input.recovery);
    if (guidance) pushFact(facts, 'guidance', { kind: 'title', text: guidance });
  }

  if (input.openWarning) {
    pushFact(facts, 'warning', {
      kind: 'warning',
      text: 'browser did not open; use launch URL',
    });
  }
  pushFact(facts, 'open', { kind: 'capability', text: input.url });

  if (input.state.kind === 'ready') {
    pushFact(facts, 'app', { kind: 'url', text: input.state.origin });
  }
  return facts;
}

function pushFact(facts: ServiceFact[], label: string, value: ServiceValue): void {
  facts.push([label, value]);
}

function insetServiceRow(row: string, width: number) {
  if (width === 0) return '';
  return `${' '.repeat(SERVICE_LEFT_INSET)}${fitTerminalRow(row, width)}`;
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
  const continuation = ' '.repeat(reserve);
  return valueRows.map((row, index) =>
    index === 0 ? `${renderedLabel}${SERVICE_GAP}${row}` : `${continuation}${row}`
  );
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
  const prefix = part.origin.slice(0, part.origin.length - part.port.length);
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
  const canRecoverManifest = recovery === START_GUI_SERVICE.recovery &&
    manifestChecksumOf(state.safeEvidence) !== undefined;
  if (canRecoverManifest) return recovery.manifestChecksumMismatch;
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
  if (
    evidence.kind !== 'materialization' || evidence.stage !== 'manifest-fetch' ||
    evidence.reason !== 'integrity-mismatch'
  ) return;
  return evidence.manifestChecksum;
}

function evidenceItems(evidence: BootSafeEvidence): readonly string[] {
  switch (evidence.kind) {
    case 'configuration':
      return [`configuration/${evidence.reason}`];
    case 'identity':
      return ['package identity refused'];
    case 'materialization': {
      const items = [evidence.stage, evidence.reason, `cleanup:${evidence.cleanup}`];
      if (evidence.publication) items.push(`publication:${evidence.publication}`);
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
      rows.push(colorEvidence(current));
      current = item;
    } else {
      current = candidate;
    }
  }
  if (current) rows.push(colorEvidence(current));
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
  return c.gray(value);
}

function ellipsize(value: string, width: number) {
  return Cli.Fmt.Text.ellipsize(Cli.stripAnsi(value), width, {
    render: ({ head, ellipsis, tail }) => `${head}${Cli.Fmt.omission(ellipsis)}${tail}`,
  });
}
