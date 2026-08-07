import { metadataRow } from '../../m.fmt/u.ts';
import { c, Is, Num, Path, type t } from '../common.ts';
import { ViteScreenLayout } from './u.vite.screen.layout.ts';

type FrameArgs = t.ViteDev.Screen.Frame.Args;
type Viewport = t.ViteDev.Screen.Frame.Viewport;

const DEFAULT_LOG_LINES = 10;
const MAX_LOG_LINES = 200;

/** Dev-screen frame layout isolated from runtime lifecycle effects. */
export const DevScreenLayout = {
  logLines: (input?: unknown) => wrangle.logLines(input),

  startup(args: t.ViteDev.Screen.Frame.StartupArgs): t.ViteDev.Screen.Frame.StartupOutput {
    const viewport = wrangle.viewport(args.viewport);
    const capacity = wrangle.capacity(viewport, args.cursorRows);
    const headerRows = ViteScreenLayout.applicationHeader(args.pkg, viewport.width);
    const visibleHeader = headerRows.slice(0, capacity);
    const showSpinner = viewport.width > 0 && capacity > visibleHeader.length;
    const bodyCapacity = Math.max(0, capacity - visibleHeader.length - (showSpinner ? 1 : 0));
    const coreRowCount = wrangle.startupCore(args, viewport.width, 1).length;
    const visibleCount = Math.min(
      wrangle.logLines(args.logLines),
      Math.max(0, bodyCapacity - coreRowCount),
    );
    const visible = visibleCount === 0 ? [] : args.lines.slice(-visibleCount);
    const sequenceWidth = ViteScreenLayout.outputSequenceWidth(visible);
    const bodyRows = [
      ...wrangle.startupCore(args, viewport.width, sequenceWidth),
      ...visible.map((line) => ViteScreenLayout.outputRow(line, viewport.width, sequenceWidth)),
    ];

    return {
      header: ViteScreenLayout.renderRows(visibleHeader, viewport.width),
      body: ViteScreenLayout.renderRows(bodyRows.slice(0, bodyCapacity), viewport.width),
      showSpinner,
    };
  },

  startupToString(args: t.ViteDev.Screen.Frame.StartupArgs) {
    const output = DevScreenLayout.startup(args);
    const rows = [
      output.header,
      output.showSpinner ? args.spinner ?? '⠋' : '',
      output.body,
    ].filter(Boolean);
    return rows.join('\n').trimEnd();
  },

  toString(args: t.ViteDev.Screen.Frame.ReadyArgs) {
    const viewport = wrangle.viewport(args.viewport);
    const { width } = viewport;
    const capacity = wrangle.capacity(viewport, args.cursorRows);
    const subHr = ViteScreenLayout.dashedDivider(width);
    const headerRows = ViteScreenLayout.applicationHeader(args.pkg, width);
    const separator = ['', subHr];
    const workspace = wrangle.workspace(args.ws, width);
    const optionContent = args.showOptions ? wrangle.options(subHr, 1).split('\n') : [];
    const fixedRowCount = headerRows.length + wrangle.readyMetadata(args, width, 1).length +
      separator.length;
    const available = Math.max(0, capacity - fixedRowCount);
    const optionalRows = wrangle.optionalRowCount(workspace) +
      wrangle.optionalRowCount(optionContent);
    const logCount = Math.min(
      wrangle.logLines(args.logLines),
      Math.max(0, available - optionalRows),
    );
    const optionalCapacity = Math.max(0, available - logCount);
    const optionBudget = Math.min(optionalCapacity, wrangle.optionalRowCount(optionContent));
    const visibleOptions = wrangle.fitOptional(optionContent, optionBudget);
    const workspaceBudget = Math.max(0, optionalCapacity - visibleOptions.length);
    const visibleWorkspace = wrangle.fitOptional(workspace, workspaceBudget);
    const visible = logCount === 0 ? [] : args.lines.slice(-logCount);
    const sequenceWidth = ViteScreenLayout.outputSequenceWidth(visible);
    const metadata = wrangle.readyMetadata(args, width, sequenceWidth);
    const options = args.showOptions
      ? wrangle.fitOptional(
        wrangle.options(subHr, ViteScreenLayout.contentColumn(sequenceWidth)).split('\n'),
        optionBudget,
      )
      : [];
    const rows = [
      ...headerRows,
      ...visibleWorkspace,
      ...metadata,
      ...options,
      ...separator,
      ...visible.map((line) => ViteScreenLayout.outputRow(line, width, sequenceWidth)),
    ];

    return ViteScreenLayout.renderRows(rows.slice(0, capacity), width);
  },
} as const;

/**
 * Helpers:
 */
const wrangle = {
  logLines(input?: unknown) {
    const value = Is.num(input) ? input : Is.string(input) ? Number(input) : undefined;
    return Is.num(value)
      ? Math.min(MAX_LOG_LINES, Math.max(0, Math.floor(value)))
      : DEFAULT_LOG_LINES;
  },

  viewport(input: Viewport): Viewport {
    return {
      width: wrangle.dimension(input.width),
      height: wrangle.dimension(input.height),
    };
  },

  dimension(input: number) {
    return Num.Is.finite(input) ? Math.max(0, Math.floor(input)) : 0;
  },

  capacity(viewport: Viewport, cursorRows: number) {
    return Math.max(0, viewport.height - wrangle.dimension(cursorRows));
  },

  startupCore(args: FrameArgs, width: number, sequenceWidth: number) {
    const metadataColumn = ViteScreenLayout.metadataColumn(width, sequenceWidth);
    const indent = ViteScreenLayout.indent(metadataColumn);
    const input = Path.trimCwd(args.paths.app.entry);
    const outDir = Path.trimCwd(args.paths.app.outDir);
    const subHr = ViteScreenLayout.dashedDivider(width);
    return [
      ViteScreenLayout.serviceUrl(args.url, metadataColumn, width),
      `${indent}${c.green('↑')}`,
      metadataRow({
        label: 'input',
        value: input,
        width,
        indent: metadataColumn,
        labelWidth: 9,
        styledLabel: c.green('input'),
      }),
      metadataRow({
        label: 'output',
        value: outDir,
        width,
        indent: metadataColumn,
        labelWidth: 9,
        styledLabel: c.white('output'),
        suffix: ViteScreenLayout.distSuffix(args.dist, args.renderedAt),
      }),
      '',
      subHr,
    ];
  },

  readyMetadata(args: FrameArgs, width: number, sequenceWidth: number) {
    const metadataColumn = ViteScreenLayout.metadataColumn(width, sequenceWidth);
    const indent = ViteScreenLayout.indent(metadataColumn);
    const input = Path.trimCwd(args.paths.app.entry);
    const outDir = Path.trimCwd(args.paths.app.outDir);
    return [
      '',
      ViteScreenLayout.serviceUrl(args.url, metadataColumn, width),
      `${indent}${c.green('↑')}`,
      metadataRow({
        label: 'input',
        value: input,
        width,
        indent: metadataColumn,
        labelWidth: 9,
        styledLabel: c.green('input'),
      }),
      metadataRow({
        label: 'output',
        value: outDir,
        width,
        indent: metadataColumn,
        labelWidth: 9,
        styledLabel: c.white('output'),
        suffix: ViteScreenLayout.distSuffix(args.dist, args.renderedAt),
      }),
    ];
  },

  workspace(ws: t.ViteDenoWorkspace | undefined, width: number) {
    if (!ws) return [];
    const text = ws.toString({ width }).trimEnd();
    return text ? text.split('\n') : [];
  },

  optionalRowCount(lines: string[]) {
    return lines.length === 0 ? 0 : lines.length + 1;
  },

  fitOptional(lines: string[], capacity: number) {
    if (lines.length === 0 || capacity <= 0) return [];
    if (capacity === 1) return [lines[0]];
    return ['', ...lines.slice(0, capacity - 1)];
  },

  options(subHr: string, contentColumn: number) {
    const key = (text: string) => c.bold(c.white(text));
    return [
      `${c.green(c.bold('options'))}${c.dim(c.green(':'))}`,
      subHr,
      wrangle.optionRow('close', key('i'), contentColumn),
      wrangle.optionRow('more', key('shift + i'), contentColumn),
      wrangle.optionRow('clear', key('k'), contentColumn),
      wrangle.optionRow('open', key('o'), contentColumn, c.dim('← (in browser)')),
      wrangle.optionRow('quit', key('ctrl + c'), contentColumn),
    ].join('\n');
  },

  optionRow(label: string, value: string, contentColumn: number, suffix = '') {
    const gap = ViteScreenLayout.indent(Math.max(1, contentColumn - label.length));
    const tail = suffix ? `  ${suffix}` : '';
    return `${label}${gap}${value}${tail}`;
  },
} as const;
