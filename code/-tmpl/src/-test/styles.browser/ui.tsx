import React from 'react';
import {
  Color,
  css,
  D,
  Is,
  Json,
  Obj,
  type Palette,
  type ProofProps,
  Schedule,
  Style,
  Time,
} from './common.ts';
import { Baseline } from './u.baseline.tsx';
import { Subject } from './u.fixture.tsx';
import { type Comparison, createReport, type Report, type RuleFailure } from './u.report.ts';

type Row = { id: string; palette: Palette; nested?: Palette };
type Sample = { id: string; key: string; override: string; parent?: string };
const palettes: readonly Palette[] = ['Light', 'Dark'];
const overrides = ['none', 'root', 'intermediate', 'direct'] as const;
const phases: readonly { name: string; rows: readonly Row[]; remount?: boolean }[] = [
  { name: 'isolated Light', rows: [{ id: 'a', palette: 'Light' }] },
  { name: 'Light then Dark', rows: [{ id: 'a', palette: 'Light' }, { id: 'b', palette: 'Dark' }] },
  { name: 'isolated Dark (remount)', rows: [{ id: 'a', palette: 'Dark' }], remount: true },
  { name: 'Dark then Light', rows: [{ id: 'a', palette: 'Dark' }, { id: 'b', palette: 'Light' }] },
  { name: 'transition → Light', rows: [{ id: 'a', palette: 'Light' }] },
  { name: 'transition → Dark', rows: [{ id: 'a', palette: 'Dark' }] },
  { name: 'transition → Light again', rows: [{ id: 'a', palette: 'Light' }] },
  { name: 'Light remount', rows: [{ id: 'a', palette: 'Light' }], remount: true },
  { name: 'nested Light / Dark', rows: [{ id: 'a', palette: 'Light', nested: 'Dark' }] },
  { name: 'nested Dark / Light', rows: [{ id: 'a', palette: 'Dark', nested: 'Light' }] },
];
const properties = [
  'color',
  'background-color',
  'font-family',
  'font-weight',
  'font-size',
  'line-height',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'border-top-color',
  'border-right-color',
  'border-bottom-color',
  'border-left-color',
  'border-top-width',
  'border-right-width',
  'border-bottom-width',
  'border-left-width',
  'border-top-style',
  'border-right-style',
  'border-bottom-style',
  'border-left-style',
  'border-top-left-radius',
  'border-top-right-radius',
  'border-bottom-right-radius',
  'border-bottom-left-radius',
] as const;
const foregroundOverride = 'rgba(180, 40, 120, 0.45)';

function Samples(props: ProofProps & { row: Row; baseline?: boolean }) {
  const { UI, row, baseline = false } = props;
  const Component = baseline ? Baseline : Subject;
  const theme = Color.theme(row.palette);
  return (
    <article style={{ background: theme.bg, padding: 8 }}>
      {overrides.map((override) => {
        return (
          <section key={override} style={{ marginBlock: 12 }}>
            <Component
              UI={UI}
              theme={row.palette}
              style={override === 'root' ? { color: foregroundOverride } : undefined}
            >
              <div style={override === 'intermediate' ? { color: foregroundOverride } : undefined}>
                <code
                  data-palette={row.palette}
                  data-override={override}
                  style={override === 'direct' ? { color: foregroundOverride } : undefined}
                >
                  {`${row.palette}: ${override} override → const answer = 42;`}
                </code>
              </div>
              {override === 'none' && row.nested && (
                <Samples UI={UI} row={{ id: 'nested', palette: row.nested }} />
              )}
            </Component>
          </section>
        );
      })}
    </article>
  );
}

/** The supplied window owns the element; iframe styles must not use the parent document. */
function snapshot(win: Window, element: Element) {
  const computed = win.getComputedStyle(element);
  return Object.fromEntries(properties.map((name) => [name, computed.getPropertyValue(name)]));
}

/** Check the exercised override locations independently of candidate/baseline agreement. */
function sampleRoot(win: Window, code: HTMLElement, override: string) {
  const root = code.closest(`[data-component="${D.displayName}"]`);
  const intermediate = code.parentElement;
  if (Is.nil(root) || Is.nil(intermediate) || intermediate.parentElement !== root) {
    throw new Error('Incorrect sample structure: expected code → intermediate → production root');
  }
  if (
    intermediate.style.color !== (override === 'intermediate' ? foregroundOverride : '') ||
    code.style.color !== (override === 'direct' ? foregroundOverride : '') ||
    (override === 'root' && win.getComputedStyle(root).color !== foregroundOverride)
  ) {
    throw new Error(`Incorrect override placement: ${override}`);
  }
  return root;
}

function Reference(props: ProofProps & { palette: Palette }) {
  React.useEffect(() => {
    async function ready() {
      await Schedule.frames(2);
      document.documentElement.dataset.baselineReady = 'true';
    }
    void ready();
  }, []);
  return <Samples UI={props.UI} baseline row={{ id: 'reference', palette: props.palette }} />;
}

function App(props: ProofProps) {
  const [phase, setPhase] = React.useState(0);
  const [generation, setGeneration] = React.useState(0);
  const [version, setVersion] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [status, setStatus] = React.useState('Not run.');
  const [report, setReport] = React.useState(
    'Not run. Click Run comparisons. Version is optional.',
  );
  const candidate = React.useRef<HTMLDivElement>(null);
  const references = React.useRef(new Map<Palette, HTMLIFrameElement>());

  // Optional completion receipt for Browser.load; navigation without assertions is not a pass.
  React.useEffect(() => {
    if (!new URLSearchParams(document.location.search).has('proof')) return;
    const pending = Time.delay(() => void run());
    return () => pending.cancel();
  }, []);

  function displayReport(report: Report) {
    const text = Json.stringify(report, 2);
    setReport(text);
    setStatus(
      Is.nil(report.error)
        ? `${report.result} · ${report.comparisons.length} comparisons`
        : `ERROR — ${report.error}`,
    );
    return text;
  }

  async function publish(report: Report) {
    const text = displayReport(report);
    const receipt = new URLSearchParams(document.location.search).get('proof');
    if (!receipt) return;
    try {
      const url = new URL(receipt);
      if (url.protocol !== 'http:' || url.hostname !== '127.0.0.1') {
        throw new Error('Proof receipt must use loopback HTTP');
      }
      const response = await fetch(url, { method: 'POST', body: text });
      if (!response.ok) throw new Error(`Proof receipt failed: ${response.status}`);
    } catch (error) {
      // Keep a delivery failure visible; never recursively retry the same failed receipt.
      displayReport({ ...report, result: 'ERROR', error: `Completion receipt: ${String(error)}` });
    }
  }

  async function run() {
    setBusy(true);
    setStatus('Running — waiting for isolated baselines…');
    setReport('Waiting for fresh isolated baseline documents…');
    const results: Comparison[] = [];
    const ruleFailures: RuleFailure[] = [];
    const input = {
      browserVersion: version,
      userAgent: navigator.userAgent,
      comparisons: results,
      ruleFailures,
    };
    try {
      await Time.waitFor(() =>
        palettes.every((palette) => {
          const doc = references.current.get(palette)?.contentDocument;
          return doc?.documentElement.dataset.baselineReady === 'true';
        }), { timeout: 30_000 });
      const expected = new Map<string, ReturnType<typeof snapshot>>();
      for (const palette of palettes) {
        const frame = references.current.get(palette)!;
        const codes = frame.contentDocument!.querySelectorAll<HTMLElement>('code');
        const keys = Array.from(
          codes,
          (code) => `${code.getAttribute('data-palette')}/${code.getAttribute('data-override')}`,
        );
        if (!Obj.eql(keys, overrides.map((override) => `${palette}/${override}`))) {
          throw new Error(`Incorrect baseline arrangement: ${palette}`);
        }
        for (const [index, override] of overrides.entries()) {
          const root = sampleRoot(frame.contentWindow!, codes[index], override);
          if (root.parentElement?.closest('[data-component]')) {
            throw new Error(`Nested baseline root: ${palette}/${override}`);
          }
          expected.set(`${palette}/${override}`, snapshot(frame.contentWindow!, codes[index]));
        }
      }
      // Begin with new roots, retaining the shared sheet across the subsequent phases.
      let committedGeneration = generation + 1;
      let previous = new Map<string, { root: Element; code: Element }>();
      for (const [index, current] of phases.entries()) {
        setStatus(`Running ${index + 1}/${phases.length} — ${current.name}`);
        if (current.remount) committedGeneration++;
        setGeneration(committedGeneration);
        setPhase(index);
        await Time.waitFor(() =>
          candidate.current?.dataset.phase === String(index) &&
          candidate.current?.dataset.generation === String(committedGeneration), {
          timeout: 5_000,
        });
        await Schedule.frames(2);
        // Expected order and ancestry come from the phase, never from the descendants' labels.
        const samples: Sample[] = current.rows.flatMap((row) =>
          overrides.flatMap((override) => {
            const sample = {
              id: `${row.id}/${override}`,
              key: `${row.palette}/${override}`,
              override,
            };
            if (override !== 'none' || Is.nil(row.nested)) return [sample];
            return [
              sample,
              ...overrides.map((nestedOverride) => ({
                id: `${row.id}/nested/${nestedOverride}`,
                key: `${row.nested}/${nestedOverride}`,
                override: nestedOverride,
                parent: `${row.id}/none`,
              })),
            ];
          })
        );
        const codes = candidate.current!.querySelectorAll<HTMLElement>('code');
        const keys = Array.from(
          codes,
          (code) => `${code.getAttribute('data-palette')}/${code.getAttribute('data-override')}`,
        );
        if (!Obj.eql(keys, samples.map((sample) => sample.key))) {
          throw new Error(`Incorrect candidate arrangement: ${current.name}`);
        }
        const next = new Map<string, { root: Element; code: Element }>();
        for (const [position, { id, key, override, parent }] of samples.entries()) {
          const code = codes[position];
          const root = sampleRoot(window, code, override);
          const expectedParent = Is.nil(parent) ? null : next.get(parent)?.root;
          const actualParent = root.parentElement?.closest('[data-component]') ?? null;
          if (actualParent !== expectedParent) {
            throw new Error(`Incorrect parent root: ${current.name}/${id}`);
          }
          const before = previous.get(id);
          if (!Is.nil(before)) {
            const invalidIdentity = current.remount
              ? root === before.root || code === before.code
              : root !== before.root || code !== before.code;
            if (invalidIdentity) {
              throw new Error(`Incorrect update/remount identity: ${current.name}/${id}`);
            }
          }
          next.set(id, { root, code });
          const actual = snapshot(window, code);
          const baseline = expected.get(key);
          if (Is.nil(baseline)) throw new Error(`Missing baseline: ${key}`);
          const differences = properties.filter((name) => actual[name] !== baseline[name]);
          const result = { phase: current.name, id, key, actual, baseline, differences };
          results.push(result);
        }
        previous = next;
        const selector = `[data-component="${D.displayName}"] code`;
        const sheet = Style.Dom.stylesheet();
        const element = document.head.querySelector<HTMLStyleElement>(
          `style[data-controller="${sheet.id}"]`,
        );
        if (!element?.isConnected || !element.sheet) {
          throw new Error('Shared stylesheet is detached');
        }
        // CSSOM interop: inspect attached style rules separately from registration receipts.
        const emitted = Array.from(element.sheet.cssRules) as CSSStyleRule[];
        const descendantCount = emitted.filter((rule) => rule.selectorText === selector).length;
        if (descendantCount !== 1) {
          ruleFailures.push({ phase: current.name, descendantRules: descendantCount });
        }
      }
      await publish(createReport(input));
    } catch (error) {
      await publish(createReport({ ...input, error: String(error) }));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h1>Scoped code styles — paint comparison</h1>
      <p>
        Recent stable Chrome, Firefox and Safari only. Fresh page per browser; no legacy fallbacks.
        All subjects run in Strict Mode. Compare the candidate with the isolated references below.
      </p>
      <label>
        Browser version (optional)
        <input
          disabled={busy}
          value={version}
          onChange={(e) => setVersion(e.target.value)}
          placeholder='Report metadata only'
        />
      </label>
      <button type='button' disabled={busy} onClick={() => void run()}>
        Run comparisons
      </button>
      <button type='button' disabled={busy} onClick={() => document.location.reload()}>
        Fresh documents
      </button>
      <p role='status' aria-live='polite'>{status}</p>
      <p>
        Return this report and screenshots of opposite themes and nested roots. A computed PASS is
        not visual acceptance. Use the selector after running to inspect each arrangement.
      </p>
      <label>
        Candidate arrangement
        <select disabled={busy} value={phase} onChange={(e) => setPhase(Number(e.target.value))}>
          {phases.map((item, index) => <option key={item.name} value={index}>{item.name}</option>)}
        </select>
      </label>
      <button type='button' disabled={busy} onClick={() => setGeneration((value) => value + 1)}>
        Remount
      </button>
      <h2>Candidate: {phases[phase].name}</h2>
      <div
        ref={candidate}
        key={generation}
        data-phase={phase}
        data-generation={generation}
        style={grid}
      >
        {phases[phase].rows.map((row) => <Samples key={row.id} UI={props.UI} row={row} />)}
      </div>
      <h2>Isolated baseline references</h2>
      <div style={grid}>
        {palettes.map((palette) => {
          return (
            <div key={palette}>
              <h3>{palette}</h3>
              <iframe
                title={`${palette} isolated baseline`}
                src={`?styles&baseline=${palette}`}
                style={{ width: '100%', height: 410, border: '1px solid #aaa' }}
                ref={(frame) => {
                  if (frame) references.current.set(palette, frame);
                }}
              />
            </div>
          );
        })}
      </div>
      <h2>Computed-style report</h2>
      <textarea
        aria-label='Computed-style report'
        style={{ width: '100%', height: 240 }}
        readOnly
        value={report}
      />
    </>
  );
}

const grid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))',
  gap: 16,
};

/** Mounted by the generated package's existing entry; no standalone HTML or template imports. */
export function StylesProof(props: ProofProps) {
  const query = new URLSearchParams(document.location.search).get('baseline');
  const baseline = palettes.find((palette) => palette === query);
  const styles = {
    base: css({
      padding: 16,
      fontFamily: 'system-ui, sans-serif',
      fontSize: 16,
      lineHeight: 1.5,
      backgroundColor: '#eee',
      color: '#222',
    }),
  };
  return (
    <div className={styles.base.class}>
      {baseline ? <Reference UI={props.UI} palette={baseline} /> : <App UI={props.UI} />}
    </div>
  );
}
