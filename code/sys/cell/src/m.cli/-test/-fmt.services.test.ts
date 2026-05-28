import { describe, expect, Fs, it, Time } from '../../-test.ts';
import { stripAnsi, type t } from '../common.ts';
import { Fmt } from '../u.fmt/u.mod.ts';

describe(`@sys/cell/cli service status formatter`, () => {
  it('shows non-default selected service mode', () => {
    const now = Time.now.timestamp;
    const cwd = Fs.cwd();
    const config = Fs.join(cwd, '-config/view.dev.yaml') as t.StringPath;
    const root = Fs.join(cwd, 'view') as t.StringDir;
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
        owner: { state: 'ready', root },
      }],
    }));

    expect(text).to.contain('service');
    expect(text).to.contain('view --mode=dev');
    expect(text).to.contain('jsr:@sys/driver-vite/service');
    expect(text).to.contain('\nroot');
    expect(text).to.contain('./view');
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
            { label: 'dist', value: 'dist/' },
          ],
        },
      }],
    }));

    const websocket = text.indexOf('ws://localhost:5175/files');
    const manifest = text.indexOf('http://localhost:5175/files/manifest');

    expect(websocket >= 0).to.eql(true);
    expect(manifest >= 0).to.eql(true);
    expect(websocket < manifest).to.eql(true);
    expect(text).to.contain('capabilities');
    expect(text).to.contain('list, stat, read, watch, manifest');
    expect(text).to.contain('dist');
    expect(text).to.contain('dist/');
    expect(text).to.not.contain('\nroot');
    expect(text).to.not.contain('\npath');
    expect(text).to.not.contain('\nport');
    expect(text).to.not.contain('namespace');
    expect(text).to.not.contain('files.kind');
    expect(text).to.not.contain('files.capabilities');
  });
});
