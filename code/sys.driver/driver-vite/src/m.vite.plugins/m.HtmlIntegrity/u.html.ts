import MagicString from 'magic-string';
import { Hash, Html, Is, type t } from './common.ts';
import { integrityError } from './u.error.ts';
import { integrityResource } from './u.url.ts';

type Element = t.Html.Element;
type ResolveResource = (url: string) => ReturnType<typeof integrityResource>;
type CssRequest = (url: string) => boolean;
type Phase =
  | { readonly kind: 'input'; readonly isCSSRequest: CssRequest }
  | { readonly kind: 'output' };
type Reference = {
  readonly element: Element;
  readonly kind: 'module' | 'style' | 'modulepreload';
  readonly url: string;
};
type Bundle = Readonly<
  Record<
    string,
    | Pick<t.Rollup.OutputChunk, 'type' | 'fileName' | 'code'>
    | Pick<t.Rollup.OutputAsset, 'type' | 'fileName' | 'source'>
  >
>;

/** Inspect metadata that Vite would otherwise consume along with bundled input tags. */
export function validateIntegrityInputs(
  html: string,
  htmlFile: string,
  base: string,
  isCSSRequest: CssRequest,
): void {
  const references = htmlReferences(html, htmlFile, { kind: 'input', isCSSRequest });
  // Source paths belong to Vite's root, not the deployment mount. Vite consumes /main.ts
  // even when the output base is /release/ or a CDN URL.
  const resolve: ResolveResource = (url) =>
    integrityResource(url, htmlFile, '/') ?? integrityResource(url, htmlFile, base);
  for (const ref of references) {
    const resource = resolve(ref.url);
    // Consumption is independent of deployment ownership: a resolver can bundle virtual:entry.
    // Vite also consumes inline module contents, including when src is external.
    const consumed = ref.kind === 'module'
      ? (ref.url !== '' && isSourceRequest(ref.url)) || ref.element.childNodes.length > 0
      : ref.kind === 'style' && consumesCss(ref.element, ref.url, isCSSRequest);
    if (!resource && !consumed) continue;
    validateCredentials(ref, htmlFile);
    if (attribute(ref.element, 'integrity') !== undefined) {
      throw integrityError(
        'authored input integrity cannot survive bundling; let the plugin generate it',
        { htmlFile, url: ref.url },
      );
    }
  }
}

/** Hash bundle bytes and edit only the covered tags' integrity/credentials attributes. */
export function finalizeIntegrityHtml(
  html: string,
  htmlFile: string,
  base: string,
  bundle: Bundle,
): string {
  const references = htmlReferences(html, htmlFile, { kind: 'output' });
  const resolve: ResolveResource = (url) => integrityResource(url, htmlFile, base);
  const source = new MagicString(html);
  const hashes = new Map<string, string>();
  for (const ref of references) {
    const resource = resolve(ref.url);
    if (!resource) continue;
    const { fileName } = resource;
    const output = Object.hasOwn(bundle, fileName) ? bundle[fileName] : undefined;
    if (!output || output.fileName !== fileName) {
      throw integrityError(
        `missing emitted output ${fileName} (public/ files are unsupported)`,
        { htmlFile, url: ref.url },
      );
    }
    if (ref.kind === 'style' ? !/\.css$/i.test(fileName) : !/\.(?:m?js)$/i.test(fileName)) {
      throw integrityError(
        `unsupported ${ref.kind} output ${fileName}`,
        { htmlFile, url: ref.url },
      );
    }
    let integrity = hashes.get(fileName);
    if (!integrity) {
      const bytes = output.type === 'chunk' ? output.code : output.source;
      integrity = sri(bytes);
      hashes.set(fileName, integrity);
    }
    validateCredentials(ref, htmlFile);
    const authored = attribute(ref.element, 'integrity');
    if (authored !== undefined && authored !== integrity) {
      throw integrityError(`conflicting integrity for ${fileName}`, { htmlFile, url: ref.url });
    }
    // Insert before a parser-established attribute, never into a trailing unquoted value.
    // In data-x=/> the slash is attribute data, not self-closing syntax.
    const name = ref.kind === 'module' ? 'src' : 'href';
    const offset = ref.element.sourceCodeLocation?.attrs?.[name]?.startOffset;
    if (offset === undefined) {
      throw integrityError('missing HTML attribute source location', { htmlFile, url: ref.url });
    }
    const attributes = [
      authored === undefined ? ` integrity="${integrity}"` : '',
      attribute(ref.element, 'crossorigin') === undefined ? ' crossorigin="anonymous"' : '',
    ].join('');
    if (attributes) source.appendLeft(offset, `${attributes.trimStart()} `);
  }
  return source.toString();
}

/** Generate SHA-256 SRI with the shared raw-digest Base64 encoding. */
export function sri(bytes: string | Uint8Array): string {
  return Hash.sha256(bytes, { encoding: 'base64' });
}

/** Match Vite's consumed input traversal separately from browser-active output coverage. */
function htmlReferences(
  html: string,
  htmlFile: string,
  phase: Phase,
): readonly Reference[] {
  const document = Html.parse(html, {
    sourceCodeLocationInfo: true,
    scriptingEnabled: phase.kind === 'output',
    onParseError(error) {
      if (error.code === 'duplicate-attribute') {
        throw integrityError(
          `duplicate HTML attribute at ${error.startLine}:${error.startCol}`,
          { htmlFile },
        );
      }
    },
  });
  const result: Reference[] = [];
  const visit = (parent: t.Html.ParentNode) => {
    for (const node of parent.childNodes) {
      if (!Html.Is.element(node)) continue;
      const htmlNamespace = node.namespaceURI === 'http://www.w3.org/1999/xhtml';
      if (phase.kind === 'output' && !htmlNamespace) {
        visit(node); // HTML integration points can contain active tags; foreign scripts are not HTML.
        continue;
      }
      if (Html.Is.template(node)) {
        // Declarative roots can load resources immediately; they are not inert templates.
        if (phase.kind === 'output' && attribute(node, 'shadowrootmode') !== undefined) {
          throw integrityError(
            'declarative shadow DOM is unsupported (<template shadowrootmode>)',
            { htmlFile },
          );
        }
        if (phase.kind === 'input') visit(node.content);
        continue;
      }
      if (phase.kind === 'output' && node.tagName === 'select') {
        throw integrityError(
          'static <select> output is unsupported: parser/browser parity is unproven',
          { htmlFile },
        );
      }
      if (htmlNamespace && node.tagName === 'base' && attribute(node, 'href') !== undefined) {
        throw integrityError(
          '<base href> is unsupported',
          { htmlFile, url: attribute(node, 'href') },
        );
      }
      if (phase.kind === 'input' && attribute(node, 'vite-ignore') !== undefined) {
        visit(node); // Vite retains this tag rather than consuming its metadata.
        continue;
      }
      const src = attribute(node, 'src');
      const href = attribute(node, 'href');
      const scriptType = attribute(node, 'type');
      const module = phase.kind === 'input'
        ? scriptType === 'module'
        : scriptType?.toLowerCase() === 'module';
      if (node.tagName === 'script' && module) {
        if (Is.str(src) || (phase.kind === 'input' && node.childNodes.length > 0)) {
          result.push({ element: node, kind: 'module', url: src ?? '' });
        }
      }
      if (node.tagName === 'link' && Is.str(href)) {
        const rel = (attribute(node, 'rel') ?? '').toLowerCase().split(/[\t\n\f\r ]+/);
        if (rel.includes('stylesheet') && rel.includes('modulepreload')) {
          throw integrityError(
            'ambiguous stylesheet/modulepreload relation',
            { htmlFile, url: href },
          );
        }
        // Vite consumes local CSS links by URL, independently of rel and namespace.
        const consumed = phase.kind === 'input' && consumesCss(node, href, phase.isCSSRequest);
        if (rel.includes('stylesheet') || consumed) {
          result.push({ element: node, kind: 'style', url: href });
        } else if (rel.includes('modulepreload')) {
          result.push({ element: node, kind: 'modulepreload', url: href });
        }
      }
      visit(node);
    }
  };
  visit(document);
  return result;
}

function attribute(element: Element, name: string): string | undefined {
  return element.attrs.find((attr) => attr.prefix === undefined && attr.name === name)?.value;
}

/** Vite's HTML import exclusions, not URL ownership; scheme-bearing IDs can reach resolvers. */
function isSourceRequest(url: string): boolean {
  return url[0] !== '#' && !/^([a-z]+:)?\/\//.test(url) && !/^\s*data:/i.test(url);
}

/** Match Vite's built-in link consumption; custom asset-source rules are refused by the plugin. */
function consumesCss(element: Element, href: string, isCSSRequest: CssRequest): boolean {
  if (['media', 'disabled', 'vite-ignore'].some((name) => attribute(element, name) !== undefined)) {
    return false;
  }
  try {
    const url = decodeURI(href);
    return isSourceRequest(url) && isCSSRequest(url);
  } catch {
    return false; // Vite does not consume a CSS link whose URI cannot be decoded.
  }
}

function validateCredentials(ref: Reference, htmlFile: string) {
  const mode = attribute(ref.element, 'crossorigin')?.toLowerCase();
  if (mode !== undefined && mode !== '' && mode !== 'anonymous') {
    throw integrityError(
      'covered resources require anonymous crossorigin',
      { htmlFile, url: ref.url },
    );
  }
}
