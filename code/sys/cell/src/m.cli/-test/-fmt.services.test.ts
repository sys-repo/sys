import { describe, expect, Fs, it, Time } from '../../-test.ts';
import { stripAnsi, type t } from '../common.ts';
import { Fmt } from '../u.fmt.ts';

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
    expect(text).to.contain('view');
    expect(text).to.contain('mode');
    expect(text).to.contain('dev');
    expect(text).to.contain('jsr:@sys/driver-vite/service');
    expect(text).to.contain('-config/view.dev.yaml');
    expect(text).to.contain('view');
    expect(text).to.not.contain(`${cwd}/`);
    expect(text).to.not.contain('jsr:@sys/tools/serve');
  });

  it('shows current-directory owner root as ./ and hides URL-redundant details', () => {
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
          urls: [{ href: 'http://localhost:5175/' as t.StringUrl, label: 'local' }],
          details: [
            { label: 'path', value: '/' },
            { label: 'port', value: '5175' },
            { label: 'dist', value: 'dist/' },
          ],
        },
      }],
    }));

    expect(text).to.contain('root      ./');
    expect(text).to.contain('http://localhost:5175/');
    expect(text).to.contain('dist');
    expect(text).to.contain('dist/');
    expect(text).to.not.contain('port');
  });
});
