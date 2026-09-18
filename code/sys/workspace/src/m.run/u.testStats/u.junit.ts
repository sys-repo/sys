import { Fs, Str, type t, Xml } from '../common.ts';

type XmlElement = t.Xml.Element;
type XmlNode = t.Xml.Node;

export const NATIVE_TEST_STATS_CAPABILITY: t.WorkspaceRun.Test.Stats.Capability = 'deno:junit';

const XML_PARSE_OPTIONS = {
  ignoreComments: true,
  ignoreWhitespace: true,
  maxAttributes: 256,
  maxDepth: 64,
} as const;

/** Parse a native Deno JUnit report into capability-tagged final package stats. */
export function parseNativeTestStatsReport(xml: string):
  | t.WorkspaceRun.Test.Stats.Observed
  | t.WorkspaceRun.Test.Stats.Unavailable {
  if (!xml.trim()) {
    return nativeTestStatsUnavailable('report:parse-failed', 'JUnit report is empty.');
  }

  const parsed = Xml.parse(xml, XML_PARSE_OPTIONS);
  if (!parsed.ok) {
    return nativeTestStatsUnavailable('report:parse-failed', parsed.error.message);
  }
  const doc = parsed.doc;

  if (!wrangle.isJunitRoot(doc.root)) {
    return nativeTestStatsUnavailable(
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
    capability: NATIVE_TEST_STATS_CAPABILITY,
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
    return nativeTestStatsUnavailable('report:missing', `JUnit report was not written: ${path}`);
  }
  if (!res.ok) return nativeTestStatsUnavailable('report:read-failed', res.error?.message);
  return parseNativeTestStatsReport(res.data ?? '');
}

export function nativeTestStatsUnavailable(
  reason: t.WorkspaceRun.Test.Stats.UnavailableReason,
  message?: string,
): t.WorkspaceRun.Test.Stats.Unavailable {
  return {
    kind: 'unavailable',
    capability: NATIVE_TEST_STATS_CAPABILITY,
    source: 'junit',
    reason,
    message,
  };
}

/**
 * Helpers:
 */
const wrangle = {
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
} as const;
