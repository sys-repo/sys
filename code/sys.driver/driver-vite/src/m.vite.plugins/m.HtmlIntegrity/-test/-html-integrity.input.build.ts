import { build, type InlineConfig } from 'vite';
import { describe, expect, Fs, it, Json, type t } from '../../../-test.ts';
import { VitePlugins } from '../../mod.ts';
import { createFixture, expectBuildRefusal, readBuiltHtml, SOURCE } from './u.fixture.ts';

type ResourceKind = 'module' | 'style';
type SubstitutionCase = {
  readonly name: string;
  readonly key: string;
  readonly target: 'type' | 'markup';
  readonly provider: 'env' | 'define';
  readonly envPrefix?: string;
};

const AUTHORED_METADATA = [
  { attribute: 'integrity="sha384-authored"', reason: 'authored input integrity' },
  { attribute: 'crossorigin="use-credentials"', reason: 'anonymous crossorigin' },
] as const;

const ROOT_INPUTS = [
  {
    name: 'module integrity',
    html: '<script type="module" src="/main.js" integrity="sha384-authored"></script>',
    reason: 'authored input integrity',
  },
  {
    name: 'module credentials',
    html: '<script type="module" src="/main.js" crossorigin="use-credentials"></script>',
    reason: 'anonymous crossorigin',
  },
  {
    name: 'stylesheet integrity',
    html: '<link rel="stylesheet" href="/main.css" integrity="sha384-authored">',
    reason: 'authored input integrity',
  },
];

const CONTAINER_INPUTS = ['template', 'noscript'].flatMap((container) =>
  AUTHORED_METADATA.flatMap((metadata) => [
    { container, kind: 'module', url: '../main.js', emitted: 'type="module"', ...metadata },
    { container, kind: 'style', url: '../main.css', emitted: 'rel="stylesheet"', ...metadata },
  ])
);

const RESOLVER_INPUTS = [
  { kind: 'module', url: 'virtual:entry' },
  { kind: 'module', url: 'jsr:@fixture/entry' },
  { kind: 'module', url: 'npm:fixture' },
  { kind: 'module', url: '@fixture/entry' },
  { kind: 'style', url: 'virtual:sheet.css' },
  { kind: 'style', url: 'virtual:sheet%2ecss' },
] as const;

const SUBSTITUTIONS: readonly SubstitutionCase[] = [
  { name: 'environment type', key: 'VITE_REVIEW_HTML', target: 'type', provider: 'env' },
  { name: 'environment markup', key: 'VITE_REVIEW_HTML', target: 'markup', provider: 'env' },
  { name: 'define markup', key: 'VITE_REVIEW_HTML', target: 'markup', provider: 'define' },
  {
    name: 'custom prefix',
    key: 'REVIEW_HTML',
    target: 'markup',
    provider: 'env',
    envPrefix: 'REVIEW_',
  },
];

describe('VitePlugins.HtmlIntegrity → authored input constraints', () => {
  const inputs = [
    {
      name: 'module integrity',
      html: '<script type="module" src="../main.js" integrity="sha256-authored"></script>',
      reason: 'authored input integrity',
    },
    {
      name: 'module credentials',
      html: '<script type="module" src="../main.js" crossorigin="use-credentials"></script>',
      reason: 'anonymous crossorigin',
    },
    {
      name: 'stylesheet integrity',
      html: '<link rel="stylesheet" href="../main.css" integrity="sha384-authored">',
      reason: 'authored input integrity',
    },
    {
      name: 'public asset outside the bundle',
      html: '<script type="module" src="/public.js"></script>',
      reason: 'missing emitted output public.js',
    },
    { name: 'base href', html: '<base href="/elsewhere/">' + SOURCE, reason: '<base href>' },
  ];
  for (const { name, html, reason } of inputs) {
    it(`refuses ${name} through Vite`, async () => {
      await using fixture = await createFixture();
      const { root, config } = fixture;
      await Fs.write(Fs.join(root, 'nested/index.html'), html, { throw: true });
      await Fs.write(Fs.join(root, 'public/public.js'), 'console.info("public");', { throw: true });
      await expectBuildRefusal(config, reason);
    });
  }

  // Input root ownership must not be confused with the output deployment mount.
  const rooted = ['/release/', 'https://cdn.example/release/'].flatMap((base) =>
    ROOT_INPUTS.map((input) => ({ base, ...input }))
  );
  for (const { base, name, html, reason } of rooted) {
    it(`refuses consumed root-relative ${name}: base=${base}`, async () => {
      await using fixture = await createFixture();
      const { root, config } = fixture;
      await Fs.write(Fs.join(root, 'nested/index.html'), html, { throw: true });
      await expectBuildRefusal({ ...config, base }, reason);
    });
  }

  for (const { container, kind, url, emitted, attribute, reason } of CONTAINER_INPUTS) {
    it(`refuses Vite-consumed ${container} ${kind} ${attribute}`, async () => {
      await using fixture = await createFixture();
      const { root, config } = fixture;
      const tag = kind === 'module'
        ? `<script type="module" src="${url}" ${attribute}></script>`
        : `<link rel="stylesheet" href="${url}" ${attribute}>`;
      await Fs.write(
        Fs.join(root, 'nested/index.html'),
        `<!doctype html><html><head></head><body><${container}>${tag}</${container}></body></html>`,
        { throw: true },
      );

      // Control: this source reaches Vite's consumption path and loses its metadata.
      await build({ ...config, plugins: [] });
      const control = await readBuiltHtml(root);
      expect(control).to.include(emitted);
      expect(control).not.to.include(attribute);
      expect(control).not.to.include(url);
      await expectBuildRefusal(config, reason);
    });
  }

  // Integrity and credentials are separate cases: either constraint must cause refusal.
  const consumed = AUTHORED_METADATA.flatMap((metadata) =>
    consumedForms(metadata.attribute).map((form) => ({ ...metadata, ...form }))
  );
  for (const { name, html, emitted, attribute, reason } of consumed) {
    it(`refuses consumed ${name}: ${attribute}`, async () => {
      await using fixture = await createFixture();
      const { root, config } = fixture;
      await Fs.write(Fs.join(root, 'nested/index.html'), html, { throw: true });

      await build({ ...config, plugins: [] });
      const control = await readBuiltHtml(root);
      expect(control).to.include(emitted);
      expect(control).not.to.include(attribute);
      await expectBuildRefusal(config, reason);
    });
  }

  const resolved = RESOLVER_INPUTS.flatMap((input) =>
    AUTHORED_METADATA.map((metadata) => ({ ...input, ...metadata }))
  );
  for (const { kind, url, attribute, reason } of resolved) {
    it(`refuses consumed resolver-backed ${kind}: ${url} ${attribute}`, async () => {
      await using fixture = await createFixture();
      const { root, config } = fixture;
      const resolver = resolverSource(kind, url);
      const html = kind === 'module'
        ? `<script type="module" src="${url}" ${attribute}></script>`
        : `<link rel="preload" as="style" href="${url}" ${attribute}>`;
      await Fs.write(Fs.join(root, 'nested/index.html'), html, { throw: true });

      await build({ ...config, plugins: [resolver.plugin] });
      const control = await readBuiltHtml(root);
      expect(resolver.loads(), 'the control must reach the source resolver').to.be.greaterThan(0);
      expect(control).to.include(kind === 'module' ? 'type="module"' : 'rel="stylesheet"');
      expect(control).not.to.include(url);
      expect(control).not.to.include(attribute);
      await expectBuildRefusal(
        { ...config, plugins: [resolver.plugin, VitePlugins.HtmlIntegrity.plugin()] },
        reason,
      );
    });
  }

  const substitutions = SUBSTITUTIONS.flatMap((substitution) =>
    AUTHORED_METADATA.map(({ attribute }) => ({ substitution, attribute }))
  );
  for (const { substitution, attribute } of substitutions) {
    it(`refuses ${substitution.name}: ${attribute}`, async () => {
      await using fixture = await createFixture();
      const { root, config } = fixture;
      const { key } = substitution;
      const { html, value } = substitutionSource(substitution, attribute);
      await Fs.write(Fs.join(root, 'nested/index.html'), html, { throw: true });
      await Fs.write(Fs.join(root, '.env'), `${key}='${value}'\n`, { throw: true });
      const next = substitutionConfig(config, substitution, value);

      // Expansion must actually reach Vite's consumption path in the opt-out control.
      await build({ ...next, plugins: [] });
      const control = await readBuiltHtml(root);
      expect(control).to.include('type="module"');
      expect(control).not.to.include(attribute);
      expect(control).not.to.include(`%${key}%`);
      await expectBuildRefusal(next, 'HTML environment substitution');
    });
  }

  for (const placement of ['before', 'after']) {
    it(`guards pre-consumption ordering: caller ${placement} integrity`, async () => {
      await using fixture = await createFixture();
      const { root, config } = fixture;
      const caller = preHtmlInput();
      await build({ ...config, plugins: [caller] });
      const control = await readBuiltHtml(root);
      expect(control).to.include('type="module"');
      expect(control).not.to.include('integrity=');

      const integrity = VitePlugins.HtmlIntegrity.plugin();
      const plugins = placement === 'before' ? [caller, integrity] : [integrity, caller];
      const reason = placement === 'before' ? 'authored input integrity' : 'pre HTML hook';
      await expectBuildRefusal({ ...config, plugins }, reason);
    });
  }

  it('refuses custom HTML asset sources rather than silently dropping link metadata', async () => {
    await using fixture = await createFixture();
    const { root, config } = fixture;
    await Fs.write(
      Fs.join(root, 'nested/index.html'),
      '<link data-css="../main.css" integrity="authored">',
      { throw: true },
    );
    const next: InlineConfig = {
      ...config,
      html: { additionalAssetSources: { link: { srcAttributes: ['data-css'] } } },
    };
    await build({ ...next, plugins: [] });
    const control = await readBuiltHtml(root);
    expect(control).to.include('rel="stylesheet"');
    expect(control).not.to.include('integrity=');
    await expectBuildRefusal(next, 'custom HTML asset sources');
  });

  const unsupported: readonly {
    readonly name: string;
    readonly config: (root: string) => InlineConfig;
  }[] = [
    { name: 'ssr', config: () => ({ build: { ssr: true } }) },
    { name: 'lib', config: (root) => ({ build: { lib: { entry: Fs.join(root, 'main.js') } } }) },
    {
      name: 'renderBuiltUrl',
      config: () => ({ experimental: { renderBuiltUrl: (file) => file } }),
    },
  ];
  for (const { name, config: configure } of unsupported) {
    it(`refuses unsupported ${name} output`, async () => {
      await using fixture = await createFixture();
      const { root, config } = fixture;
      const overrides = configure(root);
      const next = { ...config, ...overrides, build: { ...config.build, ...overrides.build } };
      await expectBuildRefusal(next, 'unsupported');
    });
  }
});

/** Each source form names the active output that independently proves Vite consumed it. */
function consumedForms(attribute: string) {
  return [
    {
      name: 'foreign module',
      html: `<svg><script type="module" src="../main.js" ${attribute}></script></svg>`,
      emitted: 'type="module"',
    },
    {
      name: 'inline module',
      html: `<script type="module" ${attribute}>import '../main.js';</script>`,
      emitted: 'type="module"',
    },
    {
      name: 'external-src inline module',
      html:
        `<script type="module" src="https://example.invalid/main.js" ${attribute}>import '../main.js';</script>`,
      emitted: 'type="module"',
    },
    {
      name: 'preload CSS',
      html: `<link rel="preload" as="style" href="../main.css" ${attribute}>`,
      emitted: 'rel="stylesheet"',
    },
    {
      name: 'unrelated-rel CSS',
      html: `<link rel="alternate" as="style" href="../main.css" ${attribute}>`,
      emitted: 'rel="stylesheet"',
    },
    {
      name: 'encoded CSS',
      html: `<link rel="preload" as="style" href="../main%2ecss" ${attribute}>`,
      emitted: 'rel="stylesheet"',
    },
  ];
}

/** Track real resolver consumption without making the loader the expected-output oracle. */
function resolverSource(kind: ResourceKind, url: string) {
  let count = 0;
  const resolvedId = kind === 'module' ? '\0fixture-source' : '\0fixture-source.css';
  const plugin: t.VitePlugin = {
    name: 'fixture:resolver-backed-source',
    resolveId: (id) => id === decodeURI(url) ? resolvedId : undefined,
    load(id) {
      if (id !== resolvedId) return;
      count++;
      return kind === 'module'
        ? 'globalThis.resolverEntry = true;'
        : 'body { color: rgb(12, 34, 56); }';
    },
  };
  return { plugin, loads: () => count } as const;
}

function substitutionSource({ key, target }: SubstitutionCase, attribute: string) {
  const token = `%${key}%`;
  if (target === 'type') {
    return {
      html: `<script type="${token}" src="../main.js" ${attribute}></script>`,
      value: 'module',
    };
  }
  return { html: token, value: `<script type="module" src="../main.js" ${attribute}></script>` };
}

function substitutionConfig(
  config: InlineConfig,
  { key, provider, envPrefix }: SubstitutionCase,
  value: string,
): InlineConfig {
  const next = { ...config, ...(envPrefix ? { envPrefix } : {}) };
  if (provider === 'env') return next;
  return { ...next, define: { [`import.meta.env.${key}`]: Json.stringify(value) }, envFile: false };
}

function preHtmlInput(): t.VitePlugin {
  return {
    name: 'fixture:pre-html-input',
    enforce: 'post',
    transformIndexHtml: {
      order: 'pre',
      handler: () => '<script type="module" src="../main.js" integrity="authored"></script>',
    },
  };
}
