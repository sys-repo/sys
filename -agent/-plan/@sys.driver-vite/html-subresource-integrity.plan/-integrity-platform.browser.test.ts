import {
  Browser,
  describe,
  expect,
  Hash,
  Is,
  it,
  Json,
  Testing,
} from '../../../../code/sys.driver/driver-vite/src/-test.ts';

// Design-only platform falsification. Not production implementation or app acceptance.
type Policy = 'none' | 'ip' | 'csp' | 'csp-wasm';
type Mode = 'static' | 'dynamic' | 'preload' | 'query' | 'worker' | 'blob' | 'wasm' | 'wasm-sri';
type Input = { mode: Mode; map: boolean; tamper: boolean; rehash?: boolean; policy: Policy };
type Proof = {
  ua: string;
  entry: boolean;
  dep: string | null;
  value: string | null;
  rejected: boolean;
  violations: string[];
};
type Scenario = { name: string; input: Input; expected: Partial<Proof> };

const ORIGINAL = 'globalThis.dep = "original";';
const ALTERED = 'globalThis.dep = "tampered";';
const WORKER = 'postMessage("original");';
const ALTERED_WORKER = 'postMessage("tampered");';
// A valid module exporting value() = 7. The altered module returns 8.
const WASM = new Uint8Array([
  0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 127, 3, 2, 1, 0,
  7, 9, 1, 5, 118, 97, 108, 117, 101, 0, 0, 10, 6, 1, 4, 0, 65, 7, 11,
]);
const ALTERED_WASM = new Uint8Array(WASM);
ALTERED_WASM[ALTERED_WASM.length - 2] = 8;

const CASES: Scenario[] = [
  { name: 'entry-only SRI does not protect a static dependency', input: { mode: 'static', map: false, tamper: true, policy: 'none' }, expected: { entry: true, dep: 'tampered' } },
  { name: 'integrity map admits original static graph', input: { mode: 'static', map: true, tamper: false, policy: 'none' }, expected: { entry: true, dep: 'original' } },
  { name: 'integrity map blocks altered static dependency', input: { mode: 'static', map: true, tamper: true, policy: 'none' }, expected: { entry: false, dep: null } },
  { name: 'integrity map blocks altered dynamic dependency', input: { mode: 'dynamic', map: true, tamper: true, policy: 'none' }, expected: { entry: true, dep: null, rejected: true } },
  { name: 'matching updated map admits altered dynamic dependency', input: { mode: 'dynamic', map: true, tamper: true, rehash: true, policy: 'none' }, expected: { entry: true, dep: 'tampered', rejected: false } },
  { name: 'failed protected preload cannot bypass mapped dynamic import', input: { mode: 'preload', map: true, tamper: true, policy: 'none' }, expected: { dep: null, rejected: true } },
  { name: 'missing map metadata permits altered dynamic dependency', input: { mode: 'dynamic', map: false, tamper: true, policy: 'none' }, expected: { entry: true, dep: 'tampered', rejected: false } },
  { name: 'Integrity-Policy blocks a dynamic dependency missing metadata', input: { mode: 'dynamic', map: false, tamper: true, policy: 'ip' }, expected: { dep: null, rejected: true } },
  { name: 'hash-only CSP admits original mapped static graph', input: { mode: 'static', map: true, tamper: false, policy: 'csp' }, expected: { entry: true, dep: 'original' } },
  { name: 'hash-only CSP rejects dynamic dependency without map metadata', input: { mode: 'dynamic', map: false, tamper: true, policy: 'csp' }, expected: { dep: null, rejected: true } },
  { name: 'hash-only CSP rejects unlisted query variant', input: { mode: 'query', map: true, tamper: true, policy: 'csp' }, expected: { dep: null, rejected: true } },
  { name: 'document map and Integrity-Policy do not authenticate worker entry', input: { mode: 'worker', map: true, tamper: true, policy: 'ip' }, expected: { value: 'tampered', rejected: false } },
  { name: 'CSP worker-src none refuses worker entry', input: { mode: 'worker', map: true, tamper: true, policy: 'csp' }, expected: { rejected: true } },
  { name: 'Integrity-Policy permits fetch-to-blob execution bypass', input: { mode: 'blob', map: true, tamper: true, policy: 'ip' }, expected: { dep: 'tampered', rejected: false } },
  { name: 'hash-only CSP refuses fetch-to-blob execution', input: { mode: 'blob', map: true, tamper: true, policy: 'csp' }, expected: { dep: null, rejected: true } },
  { name: 'Integrity-Policy does not authenticate fetched WASM', input: { mode: 'wasm', map: true, tamper: true, policy: 'ip' }, expected: { value: '8', rejected: false } },
  { name: 'CSP without wasm-unsafe-eval refuses WASM compilation', input: { mode: 'wasm', map: true, tamper: true, policy: 'csp' }, expected: { rejected: true } },
  { name: 'wasm-unsafe-eval alone admits altered WASM', input: { mode: 'wasm', map: true, tamper: true, policy: 'csp-wasm' }, expected: { value: '8', rejected: false } },
  { name: 'fetch integrity admits original WASM', input: { mode: 'wasm-sri', map: true, tamper: false, policy: 'csp-wasm' }, expected: { value: '7', rejected: false } },
  { name: 'fetch integrity blocks altered WASM before compilation', input: { mode: 'wasm-sri', map: true, tamper: true, policy: 'csp-wasm' }, expected: { rejected: true } },
];

function sri(bytes: string | Uint8Array) {
  return Hash.sha256(bytes, { encoding: 'base64' });
}

function entrySource(mode: Mode) {
  if (mode === 'static') return 'import "./dep.js"; globalThis.entry = true;';
  let body: string;
  if (mode === 'worker') {
    body = `return await new Promise((resolve, reject) => {
      const worker = new Worker('/worker.js', { type: 'module' });
      worker.onmessage = e => { worker.terminate(); resolve(e.data); };
      worker.onerror = e => { worker.terminate(); reject(new Error(e.message)); };
    });`;
  } else if (mode === 'blob') {
    body = `const text = await (await fetch('/dep.js')).text();
      const url = URL.createObjectURL(new Blob([text], { type: 'text/javascript' }));
      try { await import(url); } finally { URL.revokeObjectURL(url); }`;
  } else if (mode === 'wasm' || mode === 'wasm-sri') {
    const options = mode === 'wasm-sri' ? `{ integrity: ${Json.stringify(sri(WASM))} }` : '{}';
    body = `const response = await fetch('/code.wasm', ${options});
      const result = await WebAssembly.instantiate(await response.arrayBuffer());
      return result.instance.exports.value();`;
  } else {
    body = `await import(${Json.stringify(mode === 'query' ? '/dep.js?variant=1' : '/dep.js')});`;
  }
  return `globalThis.entry = true; globalThis.run = async () => { ${body} };`;
}

const OBSERVER = `
  const violations = [];
  document.addEventListener('securitypolicyviolation', e => {
    violations.push(e.effectiveDirective + ':' + e.blockedURI);
  });
  window.addEventListener('load', async () => {
    let rejected = false;
    let value = null;
    try { if (globalThis.run) value = String(await globalThis.run()); }
    catch (error) { rejected = true; }
    await fetch('/proof', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ua: navigator.userAgent, entry: globalThis.entry === true,
        dep: globalThis.dep ?? null, value, rejected, violations }),
    });
  }, { once: true });
`;

describe('Design probe: native dependency integrity enforcement and bypasses', () => {
  it('separates digest enforcement, missing metadata, and other execution paths', async () => {
    for (const scenario of CASES) {
      const { input } = scenario;
      const entry = entrySource(input.mode);
      const dep = input.tamper ? ALTERED : ORIGINAL;
      const expectedDep = input.rehash ? dep : ORIGINAL;
      const map = Json.stringify({ integrity: {
        '/entry.js': sri(entry), '/dep.js': sri(expectedDep), '/worker.js': sri(WORKER),
      } });
      const hashes = [entry, expectedDep, WORKER, OBSERVER, map].map(sri);
      const csp = `script-src ${hashes.map(hash => `'${hash}'`).join(' ')}${
        input.policy === 'csp-wasm' ? " 'wasm-unsafe-eval'" : ''
      }; worker-src 'none'; object-src 'none'; base-uri 'none'`;
      const reports: Proof[] = [];
      const requests: string[] = [];
      const server = Testing.Http.server(async request => {
        const url = new URL(request.url);
        requests.push(`${request.method} ${url.pathname}${url.search}`);
        if (url.pathname === '/proof' && request.method === 'POST') {
          const report = Json.parse<Proof>(await request.text());
          if (!report) throw new Error('Missing observer report.');
          reports.push(report);
          return new Response(null, { status: 204 });
        }
        if (url.pathname === '/favicon.ico') return new Response(null, { status: 204 });
        const headers = new Headers({ 'cache-control': 'no-store' });
        if (url.pathname === '/') {
          headers.set('content-type', 'text/html');
          if (input.policy === 'ip') headers.set('Integrity-Policy', 'blocked-destinations=(script)');
          if (input.policy === 'csp' || input.policy === 'csp-wasm') headers.set('Content-Security-Policy', csp);
          return new Response(`<!doctype html><head>
            <script>${OBSERVER}</script>
            ${input.map ? `<script type="importmap">${map}</script>` : ''}
            ${input.mode === 'preload' ? '<link rel="modulepreload" href="/dep.js" crossorigin>' : ''}
            <script type="module" src="/entry.js" integrity="${sri(entry)}" crossorigin></script>
            </head><body>design probe</body>`, { headers });
        }
        if (url.pathname === '/code.wasm') {
          headers.set('content-type', 'application/wasm');
          return new Response(input.tamper ? ALTERED_WASM : WASM, { headers });
        }
        headers.set('content-type', 'application/javascript');
        if (url.pathname === '/entry.js') return new Response(entry, { headers });
        if (url.pathname === '/dep.js') return new Response(dep, { headers });
        if (url.pathname === '/worker.js') return new Response(input.tamper ? ALTERED_WORKER : WORKER, { headers });
        return new Response(null, { status: 404 });
      });
      try {
        const result = await Browser.load(server.url.raw, { waitAfterLoad: 500 });
        console.info(Json.stringify({ name: scenario.name, reports, errors: result.errors, requests }));
        expect(reports.length, scenario.name).to.eql(1);
        const proof = reports[0];
        if (!proof) throw new Error('Missing positive observer completion.');
        for (const [key, value] of Object.entries(scenario.expected)) {
          expect(proof[key as keyof Proof], `${scenario.name}: ${key}`).to.eql(value);
        }
        expect(Is.str(proof.ua), 'executed browser identity').to.eql(true);
        expect(result.errors.some(error => /404|MIME type|CORS policy/.test(error)), 'valid transport').to.eql(false);
      } finally {
        await server.dispose();
      }
    }
  });
});
