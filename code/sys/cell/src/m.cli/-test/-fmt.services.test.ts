import { describe, expect, Fs, it, Time } from '../../-test.ts';
import type { StartedServiceStatus } from '../../m.cell/u.services/u.status.ts';
import { c, Cli, stripAnsi, type t } from '../common.ts';
import { Fmt } from '../u.fmt/u.mod.ts';

const OSC_8 = '\x1b]8;;';
const STRING_TERMINATOR = '\x1b\\';

describe(`@sys/cell/cli service status formatter`, () => {
  describe('service hierarchy', () => {
    it('renders service identity, mode, and nested facts as one hierarchy', () => {
      const cwd = Fs.cwd();
      const root = Fs.join(cwd, 'view') as t.StringDir;
      const rendered = Fmt.Services.started({
        services: [serviceStatus({
          from: 'jsr:@sys/driver-vite/service',
          variant: 'dev' as t.Cell.Id,
          owner: { state: 'ready', root },
        })],
      });
      const text = stripAnsi(rendered);
      const lines = text.split('\n');
      const serviceLine = lines.find((line) => line.trimStart().startsWith('service')) ?? '';
      const moduleLine = lines.find((line) => line.trimStart().startsWith('module')) ?? '';
      const rootLine = lines.find((line) => line.trimStart().startsWith('root')) ?? '';

      expect(rendered).to.contain(c.green('service'));
      expect(rendered).to.contain(c.white('view'));
      expect(text).to.contain('service');
      expect(text).to.contain('view --mode=dev');
      expect(text).to.contain('jsr:@sys/driver-vite/service');
      expect(indentOf(moduleLine)).to.eql(indentOf(serviceLine) + 1);
      expect(indentOf(rootLine)).to.eql(indentOf(serviceLine) + 1);
      expect(text).to.contain('./view');
    });
  });

  describe('responsive fitting', () => {
    it('ellipsizes root paths against terminal width', () => {
      const text = stripAnsi(Fmt.Services.started({
        width: 48,
        services: [serviceStatus({
          owner: {
            state: 'ready',
            root: '/sample/workspace/with/a/very/long/path/to/ui-components/dist',
          },
        })],
      }));
      const rootLine = text.split('\n').find((line) => line.trimStart().startsWith('root')) ?? '';

      expect(rootLine.includes('…')).to.eql(true);
      expect(rootLine.length <= 48).to.eql(true);
      expect(rootLine).to.contain('/sample');
      expect(rootLine).to.contain('/dist');
    });

    it('collapses long service-board values instead of terminal-wrapping', () => {
      const rendered = Fmt.Services.started({
        width: 42,
        services: [serviceStatus({
          name: 'very-long-static-view-service-name' as t.Cell.Id,
          from: 'jsr:@sys/http/server/static/surfaces/that/should/not/wrap',
          owner: {
            state: 'ready',
            root: '/sample/workspace/cell.stripe/view',
            urls: [{
              href: 'http://127.0.0.1:8080/payments/customer/session/that/should/not/wrap',
            }],
          },
        })],
      });
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
      const href = 'http://127.0.0.1:8080/services/manifest?mode=dev#top' as t.StringUrl;
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
      expect(wide).to.contain(target);
      expect(stripAnsi(wide)).to.contain('http://localhost:8080/services/manifest?mode=dev#top');
      expect(Cli.Fmt.Text.Width.measure(linkedLine)).to.eql(
        Cli.Fmt.Text.Width.measure(stripAnsi(linkedLine)),
      );
    });

    it('preserves origin and path styling through clipped linked labels', () => {
      const href = 'http://127.0.0.1:8080/files/manifest' as t.StringUrl;
      const rendered = Fmt.Services.started({
        width: 42,
        hyperlinks: true,
        services: [serviceWithUrls([{ href }])],
      });
      const line = urlLine(rendered);
      const target = `${OSC_8}${new URL(href).href}${STRING_TERMINATOR}`;

      expect(stripAnsi(line)).to.contain('http://localhost…/files/manifest');
      expect(line).to.contain(c.cyan('http://localhost'));
      expect(line).to.contain(Cli.Fmt.omission('…'));
      expect(line).to.contain(c.gray('/files/manifest'));
      expect(line).to.not.contain(c.cyan('/files/manifest'));
      expect(line).to.contain(target);
    });

    it('keeps repeated origins gray through clipped linked labels', () => {
      const href = 'http://127.0.0.1:8080/files/manifest' as t.StringUrl;
      const rendered = Fmt.Services.started({
        width: 42,
        hyperlinks: true,
        services: [serviceWithUrls([
          { href: 'http://127.0.0.1:8080/files' as t.StringUrl },
          { href },
        ])],
      });
      const line = urlLines(rendered)[1] ?? '';

      expect(stripAnsi(line)).to.contain('http://localhost…/files/manifest');
      expect(line).to.contain(c.gray('http://localhost'));
      expect(line).to.contain(c.gray('/files/manifest'));
      expect(line).to.not.contain(c.cyan('http://localhost'));
    });

    it('preserves clipped port and suffix style boundaries', () => {
      const cases = [
        {
          href: 'http://127.0.0.1:8080/x' as t.StringUrl,
          text: 'http://…8080/x',
          suffix: c.gray('/x'),
        },
        {
          href: 'http://very-long-service-hostname.example:8080/' as t.StringUrl,
          text: 'http://…:8080/',
          suffix: c.cyan('/'),
        },
      ] as const;

      for (const item of cases) {
        const rendered = Fmt.Services.started({
          width: 24,
          hyperlinks: true,
          services: [serviceWithUrls([{ href: item.href }])],
        });
        const line = urlLine(rendered);

        expect(stripAnsi(line)).to.contain(item.text);
        expect(line).to.contain(c.bold(c.cyan('8080')));
        expect(line).to.contain(item.suffix);
        expect(line).to.contain(`${OSC_8}${new URL(item.href).href}${STRING_TERMINATOR}`);
      }
    });

    it('leaves omission-only URL labels unlinked', () => {
      const rendered = Fmt.Services.started({
        width: 8,
        hyperlinks: true,
        services: [serviceWithUrls([{ href: 'http://127.0.0.1:8080/payments/' }])],
      });
      const text = stripAnsi(rendered);

      expect(rendered).not.to.contain(OSC_8);
      for (const line of text.split('\n').filter(Boolean)) expect(line.length <= 8).to.eql(true);
    });
  });

  describe('URL admission', () => {
    it('links credential-free HTTP(S) and WS(S) targets', () => {
      for (const protocol of ['http', 'https', 'ws', 'wss']) {
        const href = `${protocol}://127.0.0.1:8080/path?a=b#top` as t.StringUrl;
        const rendered = Fmt.Services.started({
          width: 100,
          hyperlinks: true,
          services: [serviceWithUrls([{ href }])],
        });

        expect(rendered).to.contain(`${OSC_8}${new URL(href).href}${STRING_TERMINATOR}`);
      }
    });

    it('keeps safe unsupported schemes plain', () => {
      const href = 'ftp://example.com/archive' as t.StringUrl;
      const rendered = Fmt.Services.started({
        width: 100,
        hyperlinks: true,
        services: [serviceWithUrls([{ href }])],
      });

      expect(rendered).not.to.contain(OSC_8);
      expect(stripAnsi(rendered)).to.contain(href);
    });

    it('rejects malformed, local, credentialed, and control-bearing targets', () => {
      const cases: readonly { href: t.StringUrl; hidden?: string }[] = [
        { href: 'relative/path' as t.StringUrl },
        { href: 'file:///tmp/secret' as t.StringUrl },
        {
          href: 'http://user:secret@127.0.0.1:8080/private' as t.StringUrl,
          hidden: 'user:secret',
        },
        {
          href: '\x1b]8;;https://evil.example/\x1b\\click-me' as t.StringUrl,
          hidden: 'evil.example',
        },
        { href: 'http://example.com/\x7fhidden' as t.StringUrl },
        { href: 'http://example.com/\x85hidden' as t.StringUrl },
      ];

      for (const item of cases) {
        const rendered = Fmt.Services.started({
          width: 100,
          hyperlinks: true,
          services: [serviceWithUrls([{ href: item.href }])],
        });

        expect(rendered).not.to.contain(OSC_8);
        expect(stripAnsi(rendered)).to.contain('invalid URL');
        if (item.hidden) expect(rendered).not.to.contain(item.hidden);
      }
    });
  });

  describe('owner projection', () => {
    it('projects owner status into ordered non-redundant rows', () => {
      const cwd = Fs.cwd();
      const websocketHref = 'ws://127.0.0.1:5175/files';
      const manifestHref = 'http://127.0.0.1:5175/files/manifest';
      const rendered = Fmt.Services.started({
        hyperlinks: true,
        services: [serviceStatus({
          from: 'jsr:@sys/driver-vite/service',
          variant: 'dev' as t.Cell.Id,
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

type ServiceStatusOptions = {
  readonly name?: t.Cell.Id;
  readonly from?: string;
  readonly variant?: t.Cell.Id;
  readonly owner?: t.Service.Status;
};

function serviceStatus(options: ServiceStatusOptions = {}): StartedServiceStatus {
  const now = Time.now.timestamp;
  const name = options.name ?? ('view' as t.Cell.Id);
  const variant = options.variant;
  const service: StartedServiceStatus['service'] = {
    name,
    use: 'Serve',
    from: options.from ?? 'jsr:@sys/tools/serve',
    config: './-config/view.yaml' as t.Cell.Path,
  };

  return {
    service,
    selection: {
      name,
      mode: variant ?? 'default',
      ...(variant ? { variant } : {}),
      descriptor: service,
      binding: service,
    },
    paths: { config: '/tmp/view.yaml' as t.StringPath },
    metrics: { start: { startedAt: now, resolvedAt: now } },
    ...(options.owner ? { owner: options.owner } : {}),
  };
}

function serviceWithUrls(urls: readonly t.Service.Url[]): StartedServiceStatus {
  return serviceStatus({ owner: { state: 'ready', urls } });
}
