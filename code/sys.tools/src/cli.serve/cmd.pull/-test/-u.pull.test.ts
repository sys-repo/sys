import { describe, expect, it } from '../../../-test.ts';
import { computeBaseHref } from '../u.url.computeBaseHref.ts';
import { rewriteAssetUrls } from '../u.url.rewrite.assetUrls.ts';
import { rewriteHtml } from '../u.url.rewrite.html.ts';

describe('cli.serve/cmd.pull → URL + HTML helpers', () => {
  describe('computeBaseHref', () => {
    it('returns base for index at bundle root', () => {
      const rootDir = '/tmp/my-bundle';
      const filePath = '/tmp/my-bundle/index.html';
      const res = computeBaseHref(rootDir, filePath, 'my-bundle');
      expect(res).to.eql('/my-bundle/');
    });

    it('returns base for index in nested subdirectory', () => {
      const rootDir = '/tmp/my-bundle';
      const filePath = '/tmp/my-bundle/app/example/index.html';

      const res = computeBaseHref(rootDir, filePath, 'my-bundle');
      expect(res).to.eql('/my-bundle/app/example/');
    });

    it('normalizes trailing slash on rootDir', () => {
      const rootDir = '/tmp/my-bundle/';
      const filePath = '/tmp/my-bundle/index.html';

      const res = computeBaseHref(rootDir, filePath, 'my-bundle');
      expect(res).to.eql('/my-bundle/');
    });

    it('computes base href for mount + nested bundle ("/foo/sys.ui.components")', () => {
      const rootDir = '/tmp/foo';
      const filePath = '/tmp/foo/sys.ui.components/index.html';

      // Mount dir: "foo"
      const res = computeBaseHref(rootDir, filePath, 'foo');

      // Local URL:
      expect(res).to.eql('/foo/sys.ui.components/');
    });
  });

  describe('rewriteAssetUrls', () => {
    it('roots absolute paths under bundleDir for root bundle', () => {
      const html = '<link href="/styles.css">' + '<script src="/my-bundle/app.js"></script>';
      const out = rewriteAssetUrls(html, 'my-bundle', '/');

      expect(out).to.contain('href="/my-bundle/styles.css"');

      // Already rooted under "/my-bundle" → unchanged.
      expect(out).to.contain('src="/my-bundle/app.js"');
    });

    it('strips bundleRootPath prefix for nested bundle and leaves others', () => {
      const html =
        '<script src="/bundles/my-bundle/pkg/entry.js"></script>' +
        '<link href="/other/styles.css">';

      const out = rewriteAssetUrls(html, 'my-bundle', '/bundles/my-bundle');

      // Path under this bundle root becomes relative.
      expect(out).to.contain('src="pkg/entry.js"');
      // Path under a different root is untouched.
      expect(out).to.contain('href="/other/styles.css"');
    });

    it('normalizes "/./" segments in rewritten asset URLs', () => {
      const html =
        '<script src="/bundles/my-bundle/./pkg/entry.js"></script>' +
        '<link href="/bundles/my-bundle/./pkg/m.chunk.js">';

      const out = rewriteAssetUrls(html, 'my-bundle', '/bundles/my-bundle');

      // Both paths should have "/./" collapsed, and trimming the bundle root
      // yields a relative path starting with "./"
      expect(out).to.contain('src="./pkg/entry.js"');
      expect(out).to.contain('href="./pkg/m.chunk.js"');
    });
  });

  describe('rewriteHtml', () => {
    it('rewrites <base> for matching host and rewrites asset URLs', () => {
      const html = [
        '<!doctype html>',
        '<html>',
        '<head>',
        '  <base href="https://example.com/bundles/my-bundle/">',
        '  <link href="/bundles/my-bundle/pkg/entry.js">',
        '  <link href="/other/styles.css">',
        '</head>',
        '<body>',
        '  <script src="/bundles/my-bundle/app.js"></script>',
        '</body>',
        '</html>',
      ].join('\n');

      const result = rewriteHtml({
        html,
        path: '/tmp/my-bundle/index.html',
        rootDir: '/tmp/my-bundle',
        bundleDir: 'my-bundle',
        bundleRootPath: '/bundles/my-bundle',
        host: 'example.com',
      });

      // 1) <base> is rewritten to a local bundle-relative base.
      expect(result).to.contain('<base href="/my-bundle/">');

      // 2) Assets under the bundle root are rewritten to relative paths.
      expect(result).to.contain('href="pkg/entry.js"');
      expect(result).to.contain('src="app.js"');

      // 3) Assets outside the bundle root are untouched.
      expect(result).to.contain('href="/other/styles.css"');
    });

    it('does not touch <base> tags for other hosts', () => {
      const html = [
        '<head>',
        '  <base href="https://other.example.com/bundles/my-bundle/">',
        '</head>',
      ].join('\n');

      const result = rewriteHtml({
        html,
        path: '/tmp/my-bundle/index.html',
        rootDir: '/tmp/my-bundle',
        bundleDir: 'my-bundle',
        bundleRootPath: '/bundles/my-bundle',
        host: 'example.com',
      });

      // unchanged, because host does not match.
      expect(result).to.contain('<base href="https://other.example.com/bundles/my-bundle/">');
    });

    it('handles example.com → "/foo/sys.ui.components" mount scenario', () => {
      const html = [
        '<!doctype html>',
        '<html>',
        '<head>',
        '  <base href="https://example.com/sys.ui.components/">',
        '  <script type="module" src="/sys.ui.components/pkg/-entry.Vary2Qzy.js"></script>',
        '</head>',
        '<body>',
        '  <div id="root"></div>',
        '</body>',
        '</html>',
      ].join('\n');

      const result = rewriteHtml({
        html,
        path: '/tmp/sys/sys.ui.components/index.html',
        rootDir: '/tmp/foo',
        bundleDir: 'foo',
        bundleRootPath: '/sys.ui.components',
        host: 'example.com',
      });

      // Base is now bundle-relative under the "/sys" mount.
      expect(result).to.contain('<base href="/foo/sys.ui.components/">');

      // Asset URL should now be relative to the base (no "/sys.ui.components/" prefix).
      expect(result).to.contain('src="pkg/-entry.Vary2Qzy.js"');
    });
  });
});
