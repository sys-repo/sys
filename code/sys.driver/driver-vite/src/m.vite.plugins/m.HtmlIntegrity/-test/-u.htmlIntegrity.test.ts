import { isCSSRequest } from 'vite';
import { describe, expect, it, Str } from '../../../-test.ts';
import { Html } from '../common.ts';
import { finalizeIntegrityHtml, sri, validateIntegrityInputs } from '../u.html.ts';
import { integrityResource } from '../u.url.ts';

const JS = 'globalThis.entry = "✓";';
const CSS = new TextEncoder().encode('body { color: red; } /* é */');
const bundle = {
  'pkg/entry.js': { type: 'chunk', fileName: 'pkg/entry.js', code: JS },
  'pkg/style.css': { type: 'asset', fileName: 'pkg/style.css', source: CSS },
  'pkg/space name.js': { type: 'asset', fileName: 'pkg/space name.js', source: JS },
} as const;
const finalize = (html: string, base = './', file = 'index.html') =>
  finalizeIntegrityHtml(html, file, base, bundle);

const validateInput = (html: string, base = './') =>
  validateIntegrityInputs(html, 'index.html', base, isCSSRequest);

// These pure contract tests do not stand in for Vite ordering or browser enforcement.
describe('HTML integrity resource ownership', () => {
  for (
    const { base, htmlFile, url } of [
      { base: './', htmlFile: 'index.html', url: './pkg/entry.js' },
      { base: '', htmlFile: 'nested/index.html', url: '../pkg/entry.js' },
      { base: '/release/', htmlFile: 'nested/index.html', url: '/release/pkg/entry.js' },
      { base: '/release/', htmlFile: 'nested/index.html', url: '../pkg/entry.js' },
      {
        base: 'https://cdn.example/release/',
        htmlFile: 'nested/index.html',
        url: 'https://cdn.example/release/pkg/entry.js',
      },
      {
        base: 'https://cdn.example/release/',
        htmlFile: 'index.html',
        url: '//cdn.example/release/pkg/entry.js',
      },
    ]
  ) {
    it(`${base || '(empty)'} + ${htmlFile} + ${url} → owned output`, () => {
      expect(integrityResource(`${url}?v=1#part`, htmlFile, base)?.fileName).to.eql('pkg/entry.js');
    });
  }
  for (
    const url of [
      'https://other.example/release/pkg/entry.js',
      'https://cdn.example/release-other/pkg/entry.js',
      'https://cdn.example/other/pkg/entry.js',
      'data:text/javascript,void(0)',
    ]
  ) {
    it(`${url} → outside CDN ownership`, () => {
      expect(integrityResource(url, 'index.html', 'https://cdn.example/release/')).to.eql(
        undefined,
      );
    });
  }
  for (
    const url of [
      'https://cdn.example/vendor/100%25.js',
      'https://cdn.example/vendor/%ZZ.js',
      'https://cdn.example/vendor%25/entry.js',
      'https://cdn.example/vendor%ZZ/entry.js',
      'https://cdn.example/release-other/%2fentry.js',
      'https://cdn.example/%76endor/100%25.js',
      '//cdn.example/vendor/100%25.js',
    ]
  ) {
    it(`${url} → outside-mount encoding does not acquire ownership`, () => {
      const base = 'https://cdn.example/release/';
      const html = Str.dedent(`
        <script type="module" src="${url}" integrity="authored" crossorigin="use-credentials"></script>
        <link rel="stylesheet" href="${url}" integrity="authored">
      `);
      expect(integrityResource(url, 'index.html', base)).to.eql(undefined);
      expect(finalize(html, base)).to.eql(html);
      expect(() => validateInput(html, base)).not.to.throw();
    });
  }

  it('preserves root-relative output outside the deployment mount', () => {
    // Output-only: root-relative input paths instead belong to Vite's source root.
    const base = 'https://cdn.example/release/';
    const url = '/vendor/100%25.js';
    const html = Str.dedent(`
      <script type="module" src="${url}" integrity="authored" crossorigin="use-credentials"></script>
      <link rel="stylesheet" href="${url}" integrity="authored">
    `);
    expect(integrityResource(url, 'index.html', base)).to.eql(undefined);
    expect(finalize(html, base)).to.eql(html);
  });
  for (
    const path of [
      '/release/pkg/%2fentry.js',
      '/rel%65ase/pkg/%252e.js',
      '/release%2fpkg/entry.js',
      '/release/%2e%2e/vendor/entry.js',
      '/vendor/../release/pkg/%5centry.js',
    ]
  ) {
    it(`${path} → ownership filtering does not hide ambiguous owned paths`, () => {
      const url = `https://cdn.example${path}`;
      expect(() => integrityResource(url, 'index.html', 'https://cdn.example/release/'))
        .to.throw('[sys:html-integrity]');
    });
  }
  it('accepts once-encoded mount names without changing URL identity', () => {
    const url = 'https://cdn.example/rel%65ase/pkg/entry.js';
    const resource = integrityResource(url, 'index.html', 'https://cdn.example/release/');
    expect(resource?.fileName).to.eql('pkg/entry.js');
    expect(resource?.identity).to.eql(url);
  });
  it('absolute URLs are external without an explicit CDN origin', () => {
    expect(integrityResource('https://site.example/pkg/entry.js', 'index.html', './')).to.eql(
      undefined,
    );
  });
  it('preserves query/fragment module identity while decoding file lookup once', () => {
    const first = integrityResource('pkg/space%20name.js?q=1#one', 'index.html', './');
    const second = integrityResource('pkg/space%20name.js?q=1#two', 'index.html', './');
    expect(first?.fileName).to.eql('pkg/space name.js');
    expect(second?.fileName).to.eql('pkg/space name.js');
    expect(first?.identity).not.to.eql(second?.identity);
  });
  for (
    const url of [
      './pkg/%2fentry.js',
      './pkg/%5Centry.js',
      './%2e%2e/pkg/entry.js',
      './pkg/%252e.js',
      './pkg/%.js',
      './pkg/%00entry.js',
      './pkg/%0aentry.js',
      '../pkg/entry.js',
      './pkg\\entry.js',
      ' ./pkg/entry.js',
    ]
  ) {
    it(`${url} → refuses ambiguous or escaping owned path`, () => {
      expect(() => integrityResource(url, 'index.html', './')).to.throw('[sys:html-integrity]');
    });
  }
});

describe('HTML integrity bytes and tag contract', () => {
  it('uses SHA-256 Base64 digest bytes, including empty inputs', () => {
    expect(sri('')).to.eql('sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=');
    expect(sri('abc')).to.eql('sha256-ungWv48Bz+pBQUDeXa4iI7ADYaOWF3qctBD/YfIAFa0=');
    expect(sri(new TextEncoder().encode(JS))).to.eql(sri(JS));
  });
  it('changes only missing integrity/credentials attributes and preserves URL spelling', () => {
    const script = '<SCRIPT type="module" src="./pkg/entry.js?v=1&amp;q=2#x" data-text=">">';
    const style = "<link rel='stylesheet' href='./pkg/style.css'/>";
    const expectedScript = script.replace(
      'src=',
      `integrity="${sri(JS)}" crossorigin="anonymous" src=`,
    );
    const expectedStyle = style.replace(
      'href=',
      `integrity="${sri(CSS)}" crossorigin="anonymous" href=`,
    );
    expect(finalize(`${script}</SCRIPT>\n${style}`)).to.eql(
      `${expectedScript}</SCRIPT>\n${expectedStyle}`,
    );
  });
  for (
    const { name, html, urlAttribute, url, integrity } of [
      {
        name: 'quoted stylesheet URL',
        html: '<link rel="stylesheet" href="pkg/style.css" data-x=/>',
        urlAttribute: 'href',
        url: 'pkg/style.css',
        integrity: sri(CSS),
      },
      {
        name: 'unquoted stylesheet URL',
        html: '<link rel=stylesheet href=pkg/style.css data-x=/>',
        urlAttribute: 'href',
        url: 'pkg/style.css',
        integrity: sri(CSS),
      },
      {
        name: 'module script',
        html: '<script type="module" src="pkg/entry.js" data-x=/></script>',
        urlAttribute: 'src',
        url: 'pkg/entry.js',
        integrity: sri(JS),
      },
    ]
  ) {
    it(`inserts effective attributes without consuming an unquoted slash: ${name}`, () => {
      const output = finalize(html);
      // Reparse: an integrity-looking substring alone does not establish an attribute.
      const node = Html.parseFragment(output).childNodes[0];
      if (!Html.Is.element(node)) throw new Error('expected parsed resource element');
      const attr = (name: string) => node.attrs.find((item) => item.name === name)?.value;
      expect(attr('integrity')).to.eql(integrity);
      expect(attr('crossorigin')).to.eql('anonymous');
      expect(attr(urlAttribute)).to.eql(url);
      expect(attr('data-x')).to.eql('/');
      expect(finalize(output)).to.eql(output);
    });
  }
  for (const container of ['template', 'noscript']) {
    for (const attr of ['integrity="sha384-conflict"', 'crossorigin="use-credentials"']) {
      it(`validates consumed ${container} metadata without rewriting inert final content: ${attr}`, () => {
        const html =
          `<${container}><script type="module" src="main.js" ${attr}></script></${container}>`;
        expect(finalize(html)).to.eql(html);
        expect(() => validateInput(html)).to.throw('[sys:html-integrity]');
      });
    }
  }
  for (
    const html of [
      '<select><link rel="stylesheet" href="pkg/style.css"></select>',
      '<select><option>Plain options are conservatively unsupported too</option></select>',
      '<SELECT><option><link rel="stylesheet" href="pkg/style.css"></SELECT>',
    ]
  ) {
    it(`refuses static select output rather than trust parser/browser parity: ${html}`, () => {
      expect(() => finalize(html)).to.throw('static <select>');
    });
  }
  it('does not turn inert select text or template content into output coverage', () => {
    const html = Str.dedent(`
      <!-- <select> -->
      <script>const text = "<select>";</script>
      <textarea><select></textarea>
      <noscript><select></noscript>
      <template><select><link rel="stylesheet" href="missing.css"></select></template>
    `);
    expect(finalize(html)).to.eql(html);
  });
  for (const mode of ['open', 'closed', 'OPEN', '', 'unknown']) {
    it(`refuses potentially active declarative shadow output: mode=${mode || '(empty)'}`, () => {
      const html =
        `<div><template shadowrootmode="${mode}"><link rel="stylesheet" href="pkg/style.css"></template></div>`;
      expect(() => finalize(html)).to.throw('declarative shadow DOM');
    });
  }
  for (const outer of ['open', 'closed']) {
    for (const inner of ['open', 'closed']) {
      it(`refuses nested shadow output: ${outer} → ${inner}`, () => {
        const html = Str.dedent(`
          <div><template shadowrootmode="${outer}">
            <div><template shadowrootmode="${inner}">
              <link rel="stylesheet" href="pkg/style.css">
            </template></div>
          </template></div>
        `);
        expect(() => finalize(html)).to.throw('declarative shadow DOM');
      });
    }
  }
  it('refuses shadow templates at active HTML integration points', () => {
    const html =
      '<svg><foreignObject><div><template shadowrootmode="open"></template></div></foreignObject></svg>';
    expect(() => finalize(html)).to.throw('declarative shadow DOM');
  });
  it('leaves shadow syntax in inert templates and raw text untouched', () => {
    const html = Str.dedent(`
      <template><div><template shadowrootmode="open">
        <link rel="stylesheet" href="missing.css">
      </template></div></template>
      <textarea><template shadowrootmode="closed"></template></textarea>
      <noscript><template shadowrootmode="open"></template></noscript>
      <!-- <template shadowrootmode="open"></template> -->
    `);
    expect(finalize(html)).to.eql(html);
  });
  for (
    const { kind, url } of [
      { kind: 'module', url: 'virtual:entry' },
      { kind: 'module', url: 'jsr:@fixture/entry' },
      { kind: 'module', url: 'npm:fixture' },
      { kind: 'style', url: 'virtual:sheet.css' },
      { kind: 'style', url: 'virtual:sheet%2ecss' },
    ]
  ) {
    for (const attr of ['integrity="authored"', 'crossorigin="use-credentials"']) {
      it(`validates resolver-backed input independently of output ownership: ${url} ${attr}`, () => {
        const html = kind === 'style'
          ? `<link rel="preload" href="${url}" ${attr}>`
          : `<script type="module" src="${url}" ${attr}></script>`;
        expect(() => validateInput(html)).to.throw('[sys:html-integrity]');
        expect(finalize(html)).to.eql(html);
      });
    }
  }
  for (
    const url of [
      'https://other.example/entry.js',
      '//other.example/entry.js',
      'data:text/javascript,void(0)',
    ]
  ) {
    it(`preserves metadata on retained external input: ${url}`, () => {
      const html =
        `<script type="module" src="${url}" integrity="authored" crossorigin="use-credentials"></script>`;
      expect(() => validateInput(html)).not.to.throw();
      expect(finalize(html)).to.eql(html);
    });
  }
  for (const attr of ['integrity="authored"', 'crossorigin="use-credentials"']) {
    it(`input consumption does not widen foreign output coverage: ${attr}`, () => {
      const html = `<svg><script type="module" src="main.js" ${attr}></script></svg>`;
      expect(finalize(html)).to.eql(html);
      expect(() => validateInput(html)).to.throw('[sys:html-integrity]');
    });
  }
  for (const retained of ['media="print"', 'disabled', 'vite-ignore']) {
    it(`does not consume a retained non-stylesheet CSS link: ${retained}`, () => {
      const html = `<link rel="preload" href="main.css" integrity="authored" ${retained}>`;
      expect(() => validateInput(html)).not.to.throw();
      expect(finalize(html)).to.eql(html);
    });
  }
  it('preserves foreign source metadata when vite-ignore prevents consumption', () => {
    const html =
      '<svg><script type="module" src="main.js" integrity="authored" vite-ignore></script></svg>';
    expect(() => validateInput(html)).not.to.throw();
    expect(finalize(html)).to.eql(html);
  });
  it('handles quoted/unquoted and entity-encoded references', () => {
    const input = '<script type=module src=./pkg/space&#32;name.js></script>';
    expect(finalize(input)).to.include(`integrity="${sri(JS)}"`);
    expect(finalize(input)).to.include('src=./pkg/space&#32;name.js');
  });
  it('ignores comments, raw text, inert templates, classic scripts, and unrelated externals', () => {
    const input = Str.dedent(`
      <!-- <script type="module" src="missing.js"></script> -->
      <script>const fake = '<link rel="stylesheet" href="missing.css">';</script>
      <textarea><script type="module" src="missing.js"></script></textarea>
      <template><script type="module" src="missing.js"></script></template>
      <script src="classic.js"></script>
      <script type="module" src="https://other.example/main.js" integrity="authored" crossorigin="use-credentials"></script>
      <link rel="modulepreload" href="dependency-only.js">
    `);
    expect(finalize(input)).to.eql(input);
    expect(() => validateInput(input)).not.to.throw();
  });
  it('visits active HTML integration points inside foreign content', () => {
    const input =
      '<svg><foreignObject><script type="module" src="pkg/entry.js"></script></foreignObject></svg>';
    expect(finalize(input)).to.include(`integrity="${sri(JS)}"`);
  });
  it('gives overlapping entry preloads the same integrity but leaves descendants outside coverage', () => {
    const input = Str.dedent(`
      <link rel="modulepreload" href="./pkg/entry.js?q=1#x">
      <link rel="modulepreload" href="./pkg/entry.js?q=2#x">
      <link rel="modulepreload" href="./pkg/dependency.js">
      <script type="module" src="./pkg/entry.js?q=1#x"></script>
    `);
    const output = finalize(input);
    expect(output.match(/integrity=/g)?.length).to.eql(2);
    expect(output.match(/crossorigin=/g)?.length).to.eql(2);
    expect(output).to.include('<link rel="modulepreload" href="./pkg/entry.js?q=2#x">');
    expect(output).to.include('<link rel="modulepreload" href="./pkg/dependency.js">');
  });
  for (const mode of ['', ' crossorigin', ' crossorigin=""', ' crossorigin="anonymous"']) {
    it(`accepts anonymous credentials: ${mode || '(absent)'}`, () => {
      const input = `<script type="module" src="pkg/entry.js"${mode}></script>`;
      expect(finalize(input)).to.include(`integrity="${sri(JS)}"`);
      expect(() => validateInput(input)).not.to.throw();
    });
  }
  it('accepts matching final metadata idempotently', () => {
    const input = `<script type="module" src="pkg/entry.js" integrity="${
      sri(JS)
    }" crossorigin></script>`;
    expect(finalize(input)).to.eql(input);
    const once = finalize('<link rel="stylesheet" href="pkg/style.css">');
    expect(finalize(once)).to.eql(once);
  });
  for (const attr of ['integrity="sha384-conflict"', 'crossorigin="use-credentials"']) {
    it(`refuses conflicting ${attr} on covered output and consumed input`, () => {
      const output = `<script type="module" src="pkg/entry.js" ${attr}></script>`;
      const input = `<script type="module" src="main.ts" ${attr}></script>`;
      expect(() => finalize(output)).to.throw('[sys:html-integrity]');
      expect(() => validateInput(input)).to.throw('[sys:html-integrity]');
    });
  }
  it('does not silently drop even apparently matching authored input integrity', () => {
    const input = `<script type="module" src="main.ts" integrity="${sri(JS)}"></script>`;
    expect(() => validateInput(input)).to.throw('authored input integrity cannot survive bundling');
  });
  it('refuses credential conflicts on overlapping entry preloads', () => {
    const html = Str.dedent(`
      <link rel="modulepreload" href="pkg/entry.js" crossorigin="use-credentials">
      <script type="module" src="pkg/entry.js"></script>
    `);
    expect(() => finalize(html)).to.throw('anonymous crossorigin');
  });
  it('identifies the HTML, original URL, and missing emitted output', () => {
    const html = '<script type="module" src="../public.js?v=2"></script>';
    expect(() => finalize(html, './', 'nested/index.html')).to.throw(
      'nested/index.html: "../public.js?v=2": missing emitted output public.js',
    );
  });
  for (
    const input of [
      '<base href="/elsewhere/">',
      '<script type="module" src="pkg/entry.js" src="other.js"></script>',
      '<link rel="stylesheet modulepreload" href="pkg/style.css">',
      '<link rel="stylesheet" href="pkg/entry.js">',
    ]
  ) {
    it(`refuses ambiguous HTML: ${input}`, () => {
      expect(() => finalize(input)).to.throw('[sys:html-integrity]');
    });
  }
});
