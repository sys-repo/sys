import { describe, expect, Fs, it, Time } from '../../-test.ts';
import { c, stripAnsi, type t } from '../common.ts';
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

  it('ellipsizes root paths against terminal width', () => {
    const now = Time.now.timestamp;
    const config = '/tmp/view.yaml' as t.StringPath;
    const text = stripAnsi(Fmt.Services.started({
      width: 48,
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
          root: '/sample/workspace/with/a/very/long/path/to/ui-components/dist',
        },
      }],
    }));

    const rootLine = text.split('\n').find((line) => line.trimStart().startsWith('root')) ?? '';

    expect(rootLine.includes('…')).to.eql(true);
    expect(rootLine.length <= 48).to.eql(true);
    expect(rootLine).to.contain('/sample');
    expect(rootLine).to.contain('/dist');
  });

  it('collapses long service-board values instead of terminal-wrapping', () => {
    const now = Time.now.timestamp;
    const rendered = Fmt.Services.started({
      width: 42,
      services: [{
        service: {
          name: 'very-long-static-view-service-name' as t.Cell.Id,
          use: 'StaticService',
          from: 'jsr:@sys/http/server/static/surfaces/that/should/not/wrap',
          config: './-config/view.yaml' as t.Cell.Path,
        },
        selection: {
          name: 'very-long-static-view-service-name' as t.Cell.Id,
          mode: 'default',
          descriptor: {
            name: 'very-long-static-view-service-name' as t.Cell.Id,
            use: 'StaticService',
            from: 'jsr:@sys/http/server/static/surfaces/that/should/not/wrap',
            config: './-config/view.yaml' as t.Cell.Path,
          },
          binding: {
            use: 'StaticService',
            from: 'jsr:@sys/http/server/static/surfaces/that/should/not/wrap',
            config: './-config/view.yaml' as t.Cell.Path,
          },
        },
        paths: { config: '/tmp/view.yaml' as t.StringPath },
        metrics: { start: { startedAt: now, resolvedAt: now } },
        owner: {
          state: 'ready',
          root: '/sample/workspace/cell.stripe/view',
          urls: [{
            href: 'http://127.0.0.1:8080/payments/customer/session/that/should/not/wrap',
          }],
        },
      }],
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

  it('keeps the board safe at an explicit tiny render width', () => {
    const now = Time.now.timestamp;
    const text = stripAnsi(Fmt.Services.started({
      width: 8,
      services: [{
        service: {
          name: 'tiny-service-name' as t.Cell.Id,
          use: 'Serve',
          from: 'jsr:@sys/tools/serve',
          config: './-config/view.yaml' as t.Cell.Path,
        },
        selection: {
          name: 'tiny-service-name' as t.Cell.Id,
          mode: 'default',
          descriptor: {
            name: 'tiny-service-name' as t.Cell.Id,
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
        paths: { config: '/tmp/view.yaml' as t.StringPath },
        metrics: { start: { startedAt: now, resolvedAt: now } },
        owner: {
          state: 'ready',
          root: '/sample/workspace/cell.stripe/view',
          urls: [{ href: 'http://127.0.0.1:8080/payments/' }],
        },
      }],
    }));

    for (const line of text.split('\n').filter(Boolean)) expect(line.length <= 8).to.eql(true);
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
            { href: 'ws://127.0.0.1:5175/files', label: 'files:websocket' },
            {
              href: 'http://127.0.0.1:5175/files/manifest',
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
