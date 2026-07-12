import { Fs, Is, Obj, Str, type t, Xml } from '../common.ts';
import type { PackageCommand } from './u.worker.ts';

export type NativeTestStatsRun = {
  /** Temporary report directory when artifact collection is active. */
  readonly dir?: t.StringDir;
  /** Prepare one package command for native stats collection. */
  readonly prepare: (args: PrepareNativeTestStatsArgs) => PreparedNativeTestStats;
  /** Remove run-scoped report artifacts. Telemetry cleanup never throws. */
  readonly cleanup: () => Promise<void>;
};

export type PrepareNativeTestStatsArgs = {
  readonly task: t.WorkspaceRun.Task;
  readonly packagePath: t.StringPath;
  readonly deno: Record<string, unknown>;
  readonly command: PackageCommand;
};

export type PreparedNativeTestStats = {
  readonly command: PackageCommand;
  readonly collect: () => Promise<t.WorkspaceRun.Test.Stats.Result>;
};

export type NativeTestTaskClassification =
  | { readonly kind: 'supported'; readonly command: string; readonly tokens: readonly string[] }
  | {
    readonly kind: 'unsupported';
    readonly command: string;
    readonly reason: t.WorkspaceRun.Test.Stats.UnsupportedReason;
    readonly tokens?: readonly string[];
  };

type XmlElement = t.Xml.Element;
type XmlNode = t.Xml.Node;

const CAPABILITY: t.WorkspaceRun.Test.Stats.Capability = 'deno:junit';
const XML_PARSE_OPTIONS = {
  ignoreComments: true,
  ignoreWhitespace: true,
  maxAttributes: 256,
  maxDepth: 64,
} as const;

/** Create a run-scoped native test stats collector backed by temporary JUnit reports. */
export async function createNativeTestStatsRun(): Promise<NativeTestStatsRun> {
  const names = new Map<string, number>();
  let dir: t.StringDir | undefined;
  let tempError: string | undefined;
  let cleaned = false;

  try {
    dir = (await Fs.makeTempDir({ prefix: 'sys-workspace-test-stats-' })).absolute as t.StringDir;
  } catch (error) {
    tempError = wrangle.errorMessage(error);
  }

  return {
    dir,
    prepare(args) {
      return wrangle.prepare({ ...args, dir, tempError, names });
    },
    async cleanup() {
      if (cleaned) return;
      cleaned = true;
      if (!dir) return;
      try {
        await Fs.remove(dir);
      } catch {
        /* Telemetry cleanup must not fail an otherwise valid workspace run. */
      }
    },
  };
}

/** Classify a deno task script for safe additive `--junit-path` instrumentation. */
export function classifyNativeTestTask(command: string): NativeTestTaskClassification {
  const trimmed = command.trim();
  if (!trimmed) return wrangle.unsupported(command, 'task:empty');

  const tokens = wrangle.tokenize(trimmed);
  if (!tokens.ok) return wrangle.unsupported(command, tokens.reason);
  if (tokens.tokens[0] !== 'deno' || tokens.tokens[1] !== 'test') {
    return wrangle.unsupported(command, 'task:not-native-deno-test', tokens.tokens);
  }
  if (tokens.tokens.includes('--')) {
    return wrangle.unsupported(command, 'task:unsupported-args', tokens.tokens);
  }
  if (
    tokens.tokens.some((token) => token === '--junit-path' || token.startsWith('--junit-path='))
  ) {
    return wrangle.unsupported(command, 'task:existing-junit-path', tokens.tokens);
  }

  return { kind: 'supported', command, tokens: tokens.tokens };
}

/** Parse a native Deno JUnit report into capability-tagged final package stats. */
export function parseNativeTestStatsReport(xml: string):
  | t.WorkspaceRun.Test.Stats.Observed
  | t.WorkspaceRun.Test.Stats.Unavailable {
  if (!xml.trim()) {
    return wrangle.unavailable('report:parse-failed', 'JUnit report is empty.');
  }

  const parsed = Xml.parse(xml, XML_PARSE_OPTIONS);
  if (!parsed.ok) {
    return wrangle.unavailable('report:parse-failed', parsed.error.message);
  }
  const doc = parsed.doc;

  if (!wrangle.isJunitRoot(doc.root)) {
    return wrangle.unavailable(
      'report:parse-failed',
      'JUnit report did not contain a testsuite root.',
    );
  }

  const warnings: string[] = [];
  const testcases = wrangle.descendants(doc.root, 'testcase');
  const declaredTests = wrangle.declaredTestCount(doc.root, warnings);
  const failedCases: t.WorkspaceRun.Test.Stats.FailedCase[] = [];
  let failures = 0;
  let errors = 0;
  let skipped = 0;
  let duration = 0;
  let hasDuration = false;

  for (const testcase of testcases) {
    const time = wrangle.numberAttr(testcase.attributes, 'time', warnings);
    if (time !== undefined) {
      duration += time * 1000;
      hasDuration = true;
    }

    const failure = wrangle.firstChild(testcase, 'failure');
    const error = wrangle.firstChild(testcase, 'error');
    if (failure) {
      failures += 1;
      failedCases.push(wrangle.failedCase(testcase, 'failure', failure));
    }
    if (error) {
      errors += 1;
      failedCases.push(wrangle.failedCase(testcase, 'error', error));
    }
    if (wrangle.firstChild(testcase, 'skipped')) skipped += 1;
  }

  if (declaredTests !== undefined && declaredTests !== testcases.length) {
    warnings.push(
      `JUnit declared ${declaredTests} tests but contained ${testcases.length} testcase elements.`,
    );
  }

  return {
    kind: 'observed',
    capability: CAPABILITY,
    source: 'junit',
    tests: testcases.length,
    failed: failures + errors,
    failures,
    errors,
    skipped,
    duration: hasDuration ? Math.round(duration) as t.Msecs : undefined,
    failedCases,
    warnings,
  };
}

/** Read and parse one JUnit artifact. */
export async function readNativeTestStatsReport(
  path: t.StringPath,
): Promise<t.WorkspaceRun.Test.Stats.Observed | t.WorkspaceRun.Test.Stats.Unavailable> {
  const res = await Fs.readText(path);
  if (!res.exists) {
    return wrangle.unavailable('report:missing', `JUnit report was not written: ${path}`);
  }
  if (!res.ok) return wrangle.unavailable('report:read-failed', res.error?.message);
  return parseNativeTestStatsReport(res.data ?? '');
}

/**
 * Helpers:
 */
const wrangle = {
  prepare(
    args: PrepareNativeTestStatsArgs & {
      readonly dir?: t.StringDir;
      readonly tempError?: string;
      readonly names: Map<string, number>;
    },
  ): PreparedNativeTestStats {
    const script = wrangle.taskScript(args.deno, args.task);
    const classification = classifyNativeTestTask(script ?? '');

    if (classification.kind === 'unsupported') {
      return wrangle.prepared(args.command, wrangle.unsupportedStats(classification));
    }

    if (!wrangle.isDenoTaskCommand(args.command, args.task)) {
      return wrangle.prepared(
        args.command,
        wrangle.unsupportedStats({
          kind: 'unsupported',
          command: script ?? '',
          reason: 'command:not-deno-task',
          tokens: classification.tokens,
        }),
      );
    }

    if (!args.dir) {
      return wrangle.prepared(
        args.command,
        wrangle.unavailable('temp:create-failed', args.tempError),
      );
    }

    const reportPath = Fs.join(args.dir, wrangle.reportFilename(args.packagePath, args.names));
    return {
      command: {
        cmd: args.command.cmd,
        args: [...args.command.args, '--junit-path', reportPath],
      },
      collect: () => readNativeTestStatsReport(reportPath),
    };
  },

  prepared(
    command: PackageCommand,
    stats: t.WorkspaceRun.Test.Stats.Result,
  ): PreparedNativeTestStats {
    return { command, collect: () => Promise.resolve(stats) };
  },

  taskScript(deno: Record<string, unknown>, task: t.WorkspaceRun.Task) {
    const tasks = deno.tasks;
    if (!Obj.isRecord(tasks)) return undefined;
    const value = tasks[task];
    return Is.str(value) ? value : undefined;
  },

  isDenoTaskCommand(command: PackageCommand, task: t.WorkspaceRun.Task) {
    return command.cmd === 'deno' && command.args[0] === 'task' && command.args[1] === task;
  },

  unsupported(
    command: string,
    reason: t.WorkspaceRun.Test.Stats.UnsupportedReason,
    tokens?: readonly string[],
  ): NativeTestTaskClassification {
    return { kind: 'unsupported', command, reason, tokens };
  },

  unsupportedStats(
    classification: Extract<NativeTestTaskClassification, { readonly kind: 'unsupported' }>,
  ): t.WorkspaceRun.Test.Stats.Unsupported {
    return {
      kind: 'unsupported',
      capability: 'none',
      reason: classification.reason,
      command: classification.command,
    };
  },

  unavailable(
    reason: t.WorkspaceRun.Test.Stats.UnavailableReason,
    message?: string,
  ): t.WorkspaceRun.Test.Stats.Unavailable {
    return {
      kind: 'unavailable',
      capability: CAPABILITY,
      source: 'junit',
      reason,
      message,
    };
  },

  reportFilename(path: t.StringPath, names: Map<string, number>) {
    const stem = path
      .split(/[\\/]+/)
      .filter(Boolean)
      .join('__')
      .replace(/[^A-Za-z0-9._-]/g, '_') || 'package';
    const next = (names.get(stem) ?? 0) + 1;
    names.set(stem, next);
    return `${stem}${next > 1 ? `-${next}` : ''}.junit.xml`;
  },

  tokenize(command: string):
    | { readonly ok: true; readonly tokens: readonly string[] }
    | { readonly ok: false; readonly reason: t.WorkspaceRun.Test.Stats.UnsupportedReason } {
    const tokens: string[] = [];
    let token = '';
    let quote: 'single' | 'double' | undefined;
    let escaping = false;

    for (const char of command) {
      if (escaping) {
        token += char;
        escaping = false;
        continue;
      }

      if (char === '\\' && quote !== 'single') {
        escaping = true;
        continue;
      }

      if (!quote && wrangle.isShellControl(char)) return { ok: false, reason: 'task:composite' };

      if (char === "'" && !quote) {
        quote = 'single';
        continue;
      }
      if (char === "'" && quote === 'single') {
        quote = undefined;
        continue;
      }
      if (char === '"' && !quote) {
        quote = 'double';
        continue;
      }
      if (char === '"' && quote === 'double') {
        quote = undefined;
        continue;
      }

      if (!quote && /\s/.test(char)) {
        if (token) tokens.push(token);
        token = '';
        continue;
      }

      token += char;
    }

    if (escaping || quote) return { ok: false, reason: 'task:parse-failed' };
    if (token) tokens.push(token);
    return { ok: true, tokens };
  },

  isShellControl(char: string) {
    return char === '&' || char === '|' || char === ';' || char === '<' || char === '>' ||
      char === '\n' || char === '\r';
  },

  isJunitRoot(element: XmlElement) {
    return element.name.local === 'testsuites' || element.name.local === 'testsuite';
  },

  declaredTestCount(root: XmlElement, warnings: string[]) {
    const rootCount = wrangle.numberAttr(root.attributes, 'tests', warnings);
    if (rootCount !== undefined) return rootCount;

    const suites = root.name.local === 'testsuite'
      ? [root]
      : wrangle.descendants(root, 'testsuite');
    let total = 0;
    let found = false;
    for (const suite of suites) {
      const count = wrangle.numberAttr(suite.attributes, 'tests', warnings);
      if (count === undefined) continue;
      found = true;
      total += count;
    }
    return found ? total : undefined;
  },

  descendants(root: XmlElement, name: string) {
    const elements: XmlElement[] = [];
    const visit = (element: XmlElement) => {
      for (const child of element.children) {
        if (!Xml.Is.element(child)) continue;
        if (child.name.local === name) elements.push(child);
        visit(child);
      }
    };
    visit(root);
    return elements;
  },

  firstChild(element: XmlElement, name: 'failure' | 'error' | 'skipped') {
    return wrangle.elementChildren(element).find((child) => child.name.local === name);
  },

  elementChildren(element: XmlElement) {
    return element.children.filter((node): node is XmlElement => Xml.Is.element(node));
  },

  numberAttr(attrs: Readonly<Record<string, string>>, name: string, warnings: string[]) {
    const value = attrs[name];
    if (value === undefined || value.trim() === '') return undefined;
    const number = Number(value);
    if (!Number.isFinite(number) || number < 0) {
      warnings.push(`JUnit attribute ${name} was not a non-negative number: ${value}`);
      return undefined;
    }
    return number;
  },

  failedCase(
    testcase: XmlElement,
    kind: t.WorkspaceRun.Test.Stats.FailedCase['kind'],
    element: XmlElement,
  ): t.WorkspaceRun.Test.Stats.FailedCase {
    return {
      kind,
      name: testcase.attributes.name ?? '',
      className: testcase.attributes.classname,
      message: wrangle.optionalText(element.attributes.message ?? wrangle.textContent(element)),
    };
  },

  textContent(element: XmlElement) {
    const text: string[] = [];
    const visit = (node: XmlNode) => {
      if (Xml.Is.text(node) || Xml.Is.cdata(node)) {
        text.push(node.text);
        return;
      }
      if (!Xml.Is.element(node)) return;
      for (const child of node.children) visit(child);
    };
    for (const child of element.children) visit(child);
    return text.join('');
  },

  optionalText(value: string) {
    const text = Str.trimEdgeNewlines(value).trim();
    return text ? text : undefined;
  },

  errorMessage(error: unknown) {
    return error instanceof Error ? error.message : String(error);
  },
} as const;
