import { describe, expect, Fs, it, Str } from '../../-test.ts';
import { c, Cli, stripAnsi, type t } from '../common.ts';
import { Fmt } from '../u.fmt/u.mod.ts';
import { serviceInput } from './u.fixture.services.ts';

const OSC_8 = '\x1b]8;;';
const STRING_TERMINATOR = '\x1b\\';

describe(`@sys/cell/cli service status formatter`, () => {
  describe('service hierarchy', () => {
    it('renders service identity, mode, and nested facts as one hierarchy', () => {
      const root = Fs.join(Fs.cwd(), 'view');
      const input = serviceInput({
        from: 'jsr:@sys/driver-vite/service',
        variant: 'dev',
        owner: { state: 'ready', root },
      });
      const rendered = Fmt.Services.started({ services: [input], terminal: false });

      expect(stripAnsi(rendered)).to.eql(Str.dedent(`
        service   view --mode=dev
         module   jsr:@sys/driver-vite/service
         root     ./view
      `));
      expect(rendered).to.contain(c.green('service'));
      expect(rendered).to.contain(c.white('view'));
    });
  });

  describe('responsive fitting', () => {
    it('aligns wide and multiline labels across the whole service list', () => {
      const services = [
        serviceInput({
          owner: { state: 'ready', details: [{ label: '界'.repeat(8), value: 'FIRST' }] },
        }),
        serviceInput({
          owner: { state: 'ready', details: [{ label: 'é\n🧪', value: 'SECOND\nTHIRD' }] },
        }),
      ];
      for (const width of [undefined, 48]) {
        const rendered = Fmt.Services.started({ services, width, terminal: false });
        const lines = stripAnsi(rendered).split('\n');
        const columns = ['FIRST', 'SECOND', 'THIRD'].map((value) => {
          const line = lines.find((line) => line.includes(value));
          if (!line) throw new Error(`Expected rendered value: ${value}`);
          return Cli.Fmt.Text.Width.measure(line.slice(0, line.indexOf(value)));
        });
        expect(columns).to.eql([20, 20, 20]);
      }
    });

    it('underlines full and clipped root paths without underlining service URLs', () => {
      const root = Fs.join(Fs.cwd(), '-sample/files');
      const input = serviceInput({
        owner: {
          state: 'ready',
          root,
          urls: [
            { href: 'ws://localhost:5050/files' },
            { href: 'http://localhost:5050/files/manifest' },
          ],
        },
      });
      for (const width of [24, 100]) {
        for (const hyperlinks of [false, true]) {
          const rendered = Fmt.Services.started({ services: [input], width, hyperlinks });
          const path = Cli.Fmt.Path.tty('./-sample/files', {
            reserve: 10,
            terminal: true,
            width,
            min: 1,
            highlightBasename: false,
          });
          const rootLine = rendered.split('\n').find((line) =>
            stripAnsi(line).trimStart().startsWith('root')
          ) ?? '';

          expect(rootLine).to.contain(c.underline(path));
          expect(stripAnsi(rootLine).trim()).to.eql(`root     ${stripAnsi(path)}`);
          expect(Cli.Fmt.Text.Width.measure(rootLine) <= width).to.eql(true);
          const urls = urlLines(rendered);
          expect(urls).to.have.length(2);
          for (const line of urls) expect(line).not.to.contain('\x1b[4m');
        }
      }
    });

    it('ellipsizes root paths against terminal width', () => {
      const input = serviceInput({
        owner: {
          state: 'ready',
          root: '/sample/workspace/with/a/very/long/path/to/ui-components/dist',
        },
      });
      const text = stripAnsi(Fmt.Services.started({ services: [input], width: 48 }));
      const rootLine = text.split('\n').find((line) => line.trimStart().startsWith('root')) ?? '';

      expect(rootLine.includes('…')).to.eql(true);
      expect(rootLine.length <= 48).to.eql(true);
      expect(rootLine).to.contain('/sample');
      expect(rootLine).to.contain('/dist');
    });

    it('collapses long service-board values instead of terminal-wrapping', () => {
      const input = serviceInput({
        name: 'very-long-static-view-service-name',
        from: 'jsr:@sys/http/server/static/surfaces/that/should/not/wrap',
        owner: {
          state: 'ready',
          root: '/sample/workspace/cell.stripe/view',
          urls: [{
            href: 'http://127.0.0.1:8080/payments/customer/session/that/should/not/wrap',
          }],
        },
      });
      const rendered = Fmt.Services.started({ services: [input], width: 42 });
      const text = stripAnsi(rendered);
      const lines = text.split('\n').filter(Boolean);

      expect(rendered).to.contain(c.dim(c.gray('…')));
      expect(rendered).not.to.contain(c.cyan('…'));
      expect(text).to.contain('service');
      expect(text).to.contain('module');
      expect(text).to.contain('url');
      expect(text).to.not.contain('very-long-static-view-service-name');
      for (const line of lines) expect(line.length <= 42).to.eql(true);
    });
  });

  describe('URL presentation', () => {
    it('preserves complete targets behind full and clipped linked labels', () => {
      const href = 'http://127.0.0.1:8080/services/manifest?mode=dev#top';
      const services = [serviceWithUrls([{ href }])];
      const plain = Fmt.Services.started({ width: 42, services });
      const linked = Fmt.Services.started({ width: 42, hyperlinks: true, services });
      const wide = Fmt.Services.started({ width: 100, hyperlinks: true, services });
      const target = `${OSC_8}${new URL(href).href}${STRING_TERMINATOR}`;
      const linkedLine = urlLine(linked);

      expect(plain).not.to.contain(OSC_8);
      expect(stripAnsi(linked)).to.eql(stripAnsi(plain));
      expect(stripAnsi(linked)).to.contain('http://loc');
      expect(stripAnsi(linked)).to.contain('…');
      expect(stripAnsi(linked)).to.not.contain(
        'http://localhost:8080/services/manifest?mode=dev#top',
      );
      expect(linked).to.contain(target);
      expect(linked).not.to.contain('\x1b[4m');
      expect(wide).to.contain(target);
      expect(wide).not.to.contain('\x1b[4m');
      expect(stripAnsi(wide)).to.contain('http://localhost:8080/services/manifest?mode=dev#top');
      expect(Cli.Fmt.Text.Width.measure(linkedLine)).to.eql(
        Cli.Fmt.Text.Width.measure(stripAnsi(linkedLine)),
      );
    });

    it('keeps repeated origins gray through clipped linked labels', () => {
      const href = 'http://127.0.0.1:8080/files/manifest';
      const rendered = Fmt.Services.started({
        width: 42,
        hyperlinks: true,
        services: [serviceWithUrls([
          { href: 'http://127.0.0.1:8080/files' },
          { href },
        ])],
      });
      const line = urlLines(rendered)[1] ?? '';

      expect(stripAnsi(line)).to.contain('http://localhost…/files/manifest');
      expect(line).to.contain(c.gray('http://localhost'));
      expect(line).to.contain(c.gray('/files/manifest'));
      expect(line).to.not.contain(c.cyan('http://localhost'));
    });

    it('leaves omission-only URL labels unlinked', () => {
      const width = 4; // Shared half-column allocation leaves one value cell.
      const rendered = Fmt.Services.started({
        width,
        hyperlinks: true,
        services: [serviceWithUrls([{ href: 'http://127.0.0.1:8080/payments/' }])],
      });
      const text = stripAnsi(rendered);

      const rows = text.split('\n');
      expect(rows).to.have.length(3); // Service, module, and URL all remain visible.
      expect(rows[2]).to.eql('   …'); // The URL value retains its three-cell column inset.
      expect(rendered).not.to.contain(OSC_8);
      for (const line of rows) expect(Cli.Fmt.Text.Width.measure(line)).to.be.at.most(width);
    });
  });

  describe('URL policy', () => {
    it('preserves shared URL validation with automatic links both off and on', () => {
      // The full scheme/control-character matrix belongs to Cli.Fmt.Service's tests.
      const href = 'http://127.0.0.1:8080/public';
      const plain = 'ftp://example.test/archive';
      const input = serviceWithUrls([
        { href },
        { href: 'http://user:secret@127.0.0.1:8080/private' },
        { href: plain },
      ]);
      const target = `${OSC_8}${href}${STRING_TERMINATOR}`;

      for (const hyperlinks of [false, true]) {
        const rendered = Fmt.Services.started({ services: [input], terminal: false, hyperlinks });
        const text = stripAnsi(rendered);

        expect(text).to.contain('http://localhost:8080/public');
        expect(text).to.contain('invalid URL');
        expect(text).to.contain(plain);
        expect(rendered).not.to.contain('user:secret');
        expect(rendered).not.to.contain(`${OSC_8}${plain}`);
        expect(rendered.includes(target)).to.eql(hyperlinks);
        if (!hyperlinks) expect(rendered).not.to.contain(OSC_8);
      }
    });
  });

  describe('owner projection', () => {
    it('projects owner status into ordered non-redundant rows', () => {
      const cwd = Fs.cwd();
      const websocketHref = 'ws://127.0.0.1:5175/files';
      const manifestHref = 'http://127.0.0.1:5175/files/manifest';
      const rendered = Fmt.Services.started({
        terminal: false,
        hyperlinks: true,
        services: [serviceInput({
          from: 'jsr:@sys/driver-vite/service',
          variant: 'dev',
          owner: {
            state: 'ready',
            root: cwd,
            urls: [
              { href: websocketHref, label: 'files:websocket' },
              { href: manifestHref, label: 'files:manifest' },
            ],
            details: [
              { label: 'path', value: '/' },
              { label: 'port', value: '5175' },
              { label: 'namespace', value: 'sys.files' },
              { label: 'files.kind', value: 'files/fs:live' },
              { label: 'files.capabilities', value: 'list,stat,read,watch,manifest' },
              { label: 'dist', value: '#1bb18, 2.1 MB, 2026 May 13 · 17d ago' },
            ],
          },
        })],
      });
      const text = stripAnsi(rendered);

      expect(rendered).to.contain(`${OSC_8}${websocketHref}${STRING_TERMINATOR}`);
      expect(rendered).to.contain(`${OSC_8}${manifestHref}${STRING_TERMINATOR}`);
      const websocket = text.indexOf('ws://localhost:5175/files');
      const manifest = text.indexOf('http://localhost:5175/files/manifest');
      const lines = text.split('\n');
      const labels = rowLabels(text);
      const serviceLine = lines.find((line) => line.trimStart().startsWith('service')) ?? '';
      const urlLine = lines.find((line) => line.includes('ws://localhost:5175/files')) ?? '';
      const manifestLine =
        lines.find((line) => line.includes('http://localhost:5175/files/manifest')) ?? '';

      expect(websocket >= 0).to.eql(true);
      expect(manifest >= 0).to.eql(true);
      expect(websocket < manifest).to.eql(true);
      expect(indentOf(urlLine)).to.eql(indentOf(serviceLine) + 1);
      expect(manifestLine.indexOf('http://localhost:5175/files/manifest')).to.eql(
        urlLine.indexOf('ws://localhost:5175/files'),
      );
      expect(labels).to.contain('capabilities');
      expect(text).to.contain('list, stat, read, watch, manifest');
      expect(labels).to.contain('build');
      expect(labels).to.not.contain('dist');
      expect(text).to.contain('dist:#1bb18, 2.1 MB, 2026 May 13 · 17d ago');
      expect(labels).to.not.contain('root');
      expect(labels).to.not.contain('path');
      expect(labels).to.not.contain('port');
      expect(text).to.not.contain('namespace');
      expect(text).to.not.contain('files.kind');
      expect(text).to.not.contain('files.capabilities');
    });
  });
});

/**
 * Helpers:
 */
function indentOf(line: string): number {
  return line.length - line.trimStart().length;
}

function rowLabels(text: string): readonly string[] {
  return text.split('\n').flatMap((line): string[] => {
    const trimmed = line.trimStart();
    if (!trimmed || trimmed.includes('://')) return [];
    return [trimmed.split(/\s+/, 1)[0]];
  });
}

function urlLine(text: string): string {
  return urlLines(text)[0] ?? '';
}

function urlLines(text: string): readonly string[] {
  return text.split('\n').filter((line) => stripAnsi(line).includes('://'));
}

function serviceWithUrls(urls: readonly t.Service.Url[]): t.Cli.Fmt.Service.Input {
  return serviceInput({ owner: { state: 'ready', urls } });
}
