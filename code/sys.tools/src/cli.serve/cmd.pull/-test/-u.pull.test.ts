import { slug, describe, expect, it, Fs } from '../../../-test.ts';
import { type t } from '../../common.ts';
import { rewriteTags } from '../u.pull.rewriteTags.ts';

describe('cli.serve/cmd.pull → URL + HTML helpers', () => {
  const makeTestDir = async () => {
    const dir = Fs.resolve(`./.tmp/test/cmd.pull/${slug()}`);
    await Fs.ensureDir(dir);
    return dir;
  };

  describe('rewriteTags', () => {
    it('rewrites root index base from remote host to local mount (/foo/)', async () => {
      const baseDir = (await makeTestDir()) as t.StringDir;
      const bundle: t.ServeTool.LocationYaml.RemoteBundle = {
        remote: { dist: 'https://example.com/dist.json' },
        local: { dir: 'foo' },
      };

      const remote = `
        <!DOCTYPE html>
        <html lang="en">
          <head>
        <base href="https://example.com">
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>example.com</title>
            <link rel="stylesheet" href="styles.css" />
          </head>
          <body>
            <ul>
              <li><a href="./sys/dev/?d">sys:dev</a></li>
              <hr />
              <li><a href="./sys/ui.components/?d">sys:ui.components</a></li>
              <li><a href="./sys/ui.factory/?d">sys:ui.factory</a></li>
              <hr />
              <li><a href="./sys/driver.automerge/">sys:driver.automerge</a></li>
              <li><a href="./sys/driver.monaco/?d">sys:driver.monaco</a></li>
              <li><a href="./sys/driver.prosemirror/?d">sys:driver.prosemirror</a></li>
              <hr />
              <li><a href="./dist.json">dist.json (#a7d17)</a></li>
            </ul>
          </body>
        </html>
        `;

      const dir = Fs.join(baseDir, 'foo');
      const indexPath = Fs.join(dir, 'index.html');

      await Fs.ensureDir(dir);
      await Fs.write(indexPath, remote, { force: true });

      await rewriteTags(baseDir, bundle);

      const res = (await Fs.readText(indexPath)).data;

      // Base tag is rewritten to the local mount (/foo/).
      expect(res).to.include('<base href="/foo/">');
      // Remote host is stripped.
      expect(res).to.not.include('https://example.com');
      // Links remain relative; resolution is via the new base.
      expect(res).to.include('<a href="./sys/dev/?d">sys:dev</a>');
    });

    it('rewrites bundle index base and asset URLs for /sys/sys/ui.components/', async () => {
      const baseDir = (await makeTestDir()) as t.StringDir;
      const bundle: t.ServeTool.LocationYaml.RemoteBundle = {
        remote: { dist: 'https://example.com/dist.json' },
        local: { dir: 'sys' },
      };

      const remote = `
        <!DOCTYPE html>
        <html lang="en">
          <head>
        <base href="https://example.com/sys/ui.components/">
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>loading...</title>
            <script type="module" crossorigin src="/sys/ui.components/./pkg/-entry.Vary2Qzy.js"></script>
            <link rel="modulepreload" crossorigin href="/sys/ui.components/./pkg/m.C_5SYDux.js">
            <link rel="modulepreload" crossorigin href="/sys/ui.components/./pkg/m.CUBIzhyw.js">
            <link rel="modulepreload" crossorigin href="/sys/ui.components/./pkg/m.CUy3WF6Y.js">
            <link rel="modulepreload" crossorigin href="/sys/ui.components/./pkg/m.BswPaJ8Z.js">
            <link rel="modulepreload" crossorigin href="/sys/ui.components/./pkg/m.CknerPxH.js">
          </head>
          <body>
            <div id="root"></div>
          </body>
        </html>
        `;

      // NOTE:
      //   baseDir       → /.../.tmp/<slug>
      //   local.dir     → 'sys'
      //   index path    → <baseDir>/sys/sys/ui.components/index.html
      //   dirname       → <baseDir>/sys/sys/ui.components
      //   slice(baseDir.length) → /sys/sys/ui.components
      //   ensureSlashWrap       → /sys/sys/ui.components/
      const dir = Fs.join(baseDir, 'sys', 'sys', 'ui.components');
      const indexPath = Fs.join(dir, 'index.html');

      await Fs.ensureDir(dir);
      await Fs.write(indexPath, remote, { force: true });

      await rewriteTags(baseDir, bundle);

      const res = (await Fs.readText(indexPath)).data;

      // Base is now the local bundle base, derived from baseDir + local.dir.
      expect(res).to.include('<base href="/sys/sys/ui.components/">');
      // Remote host is stripped.
      expect(res).to.not.include('https://example.com');

      // Root-absolute asset URLs under /sys/ui.components/... are normalized
      // by trimming the '/./' segment to become bundle-relative ./pkg/...:
      expect(res).to.include(
        '<script type="module" crossorigin src="./pkg/-entry.Vary2Qzy.js"></script>',
      );
      expect(res).to.include('<link rel="modulepreload" crossorigin href="./pkg/m.C_5SYDux.js">');

      // Ensure no lingering root-absolute bundle asset URLs with '/./'.
      expect(res).to.not.include('/sys/ui.components/./pkg/');
    });
  });
});
