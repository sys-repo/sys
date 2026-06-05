import { describe, expect, Fs, it, Time } from '../../-test.ts';
import { c, Cli, stripAnsi, type t } from '../common.ts';
import { Fmt } from '../u.fmt/u.mod.ts';

describe(`@sys/cell/cli service status formatter`, () => {
  it('shows non-default selected service mode', () => {
    const now = Time.now.timestamp;
    const cwd = Fs.cwd();
    const config = Fs.join(cwd, '-config/view.dev.yaml') as t.StringPath;
    const root = Fs.join(cwd, 'view') as t.StringDir;
    const rendered = Fmt.Services.started({
      services: [{
        service: {
          name: 'view' as t.Cell.Id,
          use: 'ViteService',
          from: 'jsr:@sys/driver-vite/service',
          config: './-config/view.dev.yaml' as t.Cell.Path,
        },
        selection: {
          name: 'view' as t.Cell.Id,
          mode: 'dev',
          variant: 'dev' as t.Cell.Id,
          descriptor: {
            name: 'view' as t.Cell.Id,
            use: 'Serve',
            from: 'jsr:@sys/tools/serve',
            config: './-config/view.yaml' as t.Cell.Path,
          },
          binding: {
            use: 'ViteService',
            from: 'jsr:@sys/driver-vite/service',
            config: './-config/view.dev.yaml' as t.Cell.Path,
          },
        },
        paths: { config },
        metrics: { start: { startedAt: now, resolvedAt: now } },
        owner: { state: 'ready', root },
      }],
    });
    const text = stripAnsi(rendered);

    expect(rendered).to.contain(c.green('service'));
    expect(rendered).to.contain(c.white('view'));
    expect(text).to.contain('service');
    expect(text).to.contain('view --mode=dev');
    expect(text).to.contain('jsr:@sys/driver-vite/service');
    expect(text).to.contain('\n  module');
    expect(text).to.contain('\n  root');
    expect(text).to.contain('./view');
  });

  it('ellipsizes root paths against terminal width', () => {
    const restore = stubCliTerminal(48);
    try {
      const now = Time.now.timestamp;
      const config = '/tmp/view.yaml' as t.StringPath;
      const text = stripAnsi(Fmt.Services.started({
        services: [{
          service: {
            name: 'view' as t.Cell.Id,
            use: 'Serve',
            from: 'jsr:@sys/tools/serve',
            config: './-config/view.yaml' as t.Cell.Path,
          },
          selection: {
            name: 'view' as t.Cell.Id,
            mode: 'default',
            descriptor: {
              name: 'view' as t.Cell.Id,
              use: 'Serve',
              from: 'jsr:@sys/tools/serve',
              config: './-config/view.yaml' as t.Cell.Path,
            },
            binding: {
              use: 'Serve',
              from: 'jsr:@sys/tools/serve',
              config: './-config/view.yaml' as t.Cell.Path,
            },
          },
          paths: { config },
          metrics: { start: { startedAt: now, resolvedAt: now } },
          owner: {
            state: 'ready',
            root: '/Users/phil/code/org.sys/sys/code/sys.ui/ui-components/dist' as t.StringDir,
          },
        }],
      }));

      const rootLine = text.split('\n').find((line) => line.trimStart().startsWith('root')) ?? '';

      expect(rootLine.includes('…')).to.eql(true);
      expect(rootLine.length <= 48).to.eql(true);
      expect(rootLine).to.contain('/Users');
      expect(rootLine).to.contain('/dist');
    } finally {
      restore();
    }
  });

  it('hides current-directory root and URL-redundant details', () => {
    const now = Time.now.timestamp;
    const cwd = Fs.cwd();
    const config = Fs.join(cwd, '-config/view.dev.yaml') as t.StringPath;
    const text = stripAnsi(Fmt.Services.started({
      services: [{
        service: {
          name: 'view' as t.Cell.Id,
          use: 'ViteService',
          from: 'jsr:@sys/driver-vite/service',
          config: './-config/view.dev.yaml' as t.Cell.Path,
        },
        selection: {
          name: 'view' as t.Cell.Id,
          mode: 'dev',
          variant: 'dev' as t.Cell.Id,
          descriptor: {
            name: 'view' as t.Cell.Id,
            use: 'Serve',
            from: 'jsr:@sys/tools/serve',
            config: './-config/view.yaml' as t.Cell.Path,
          },
          binding: {
            use: 'ViteService',
            from: 'jsr:@sys/driver-vite/service',
            config: './-config/view.dev.yaml' as t.Cell.Path,
          },
        },
        paths: { config },
        metrics: { start: { startedAt: now, resolvedAt: now } },
        owner: {
          state: 'ready',
          root: cwd,
          urls: [
            { href: 'ws://127.0.0.1:5175/files' as t.StringUrl, label: 'files:websocket' },
            {
              href: 'http://127.0.0.1:5175/files/manifest' as t.StringUrl,
              label: 'files:manifest',
            },
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
      }],
    }));

    const websocket = text.indexOf('ws://localhost:5175/files');
    const manifest = text.indexOf('http://localhost:5175/files/manifest');
    const lines = text.split('\n');
    const labels = rowLabels(text);
    const urlLine = lines.find((line) => line.includes('ws://localhost:5175/files')) ?? '';
    const manifestLine =
      lines.find((line) => line.includes('http://localhost:5175/files/manifest')) ?? '';

    expect(websocket >= 0).to.eql(true);
    expect(manifest >= 0).to.eql(true);
    expect(websocket < manifest).to.eql(true);
    expect(urlLine.startsWith('  url')).to.eql(true);
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

/**
 * Helpers:
 */
function stubCliTerminal(width: number): () => void {
  const screen = Cli.Screen as { size: () => { width: number; height: number } };
  const is = Cli.Is as { terminal: (stream?: t.StdioName) => boolean };
  const prevSize = screen.size;
  const prevTerminal = is.terminal;
  screen.size = () => ({ width, height: 24 });
  is.terminal = () => true;
  return () => {
    screen.size = prevSize;
    is.terminal = prevTerminal;
  };
}

function rowLabels(text: string): readonly string[] {
  return text.split('\n').flatMap((line): string[] => {
    const trimmed = line.trimStart();
    if (!trimmed || trimmed.includes('://')) return [];
    return [trimmed.split(/\s+/, 1)[0]];
  });
}
