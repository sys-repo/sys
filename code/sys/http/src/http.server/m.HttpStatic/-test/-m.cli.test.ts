import { describe, expect, Fs, it, type t } from '../../../-test.ts';
import { cli, cliWith } from '../m.cli.ts';

const CONFIG = 'view';
const CONFIG_PATH = '-config/@sys.http/static/view.yaml';

describe('HttpStatic CLI', () => {
  it('shows root lifecycle help', async () => {
    const cwd = await tempRoot();
    const res = await captureInfo(() => cli(cwd, ['--help']));

    expect(res.value).to.eql(0);
    expect(res.output).to.contain('@sys/http/server/static');
    expect(res.output).to.contain('deno run -ERN jsr:@sys/http/server/static [options]');
    expect(res.output).to.contain('config --help');
    expect(res.output).to.contain('--dir <path>');
    expect(res.output.includes('Does not start a server')).to.eql(false);
    expect(res.output.includes('Cell')).to.eql(false);
    expect(res.output.includes('Config YAML')).to.eql(false);
  });

  it('shows config namespace help', async () => {
    const cwd = await tempRoot();
    const res = await captureInfo(() => cli(cwd, ['config', '--help']));

    expect(res.value).to.eql(0);
    expect(res.output).to.contain('Manage durable config for static HTTP server instances.');
    expect(res.output).to.contain('config add [options]');
  });

  it('shows config add help', async () => {
    const cwd = await tempRoot();
    const res = await captureInfo(() => cli(cwd, ['config', 'add', '--help']));

    expect(res.value).to.eql(0);
    expect(res.output).to.contain('--config <name|path>');
    expect(res.output).to.contain('--dry-run');
    expect(res.output).to.contain('does not start a server');
  });

  it('rejects unknown CLI flags before running a command', async () => {
    const cwd = await tempRoot();
    const res = await captureInfo(() => cli(cwd, ['--wat']));

    expect(res.value).to.eql(1);
    expect(res.output).to.contain('Unknown option: --wat');
  });

  it('rejects config-only options on the root start command', async () => {
    const cwd = await tempRoot();
    const res = await captureInfo(() => cli(cwd, ['--config', CONFIG]));

    expect(res.value).to.eql(1);
    expect(res.output).to.contain('Unexpected option for static server start: --config');
  });

  it('starts the static lifecycle command from root args', async () => {
    const cwd = await tempRoot();
    const calls: t.HttpStatic.StartArgs[] = [];
    const start: t.HttpStatic.Lib['start'] = (args) => {
      calls.push(args ?? {});
      const started = { finished: Promise.resolve() } as unknown as t.HttpServer.Started;
      return Promise.resolve(started);
    };

    const res = await captureInfo(() =>
      cliWith(
        { start },
        cwd,
        ['--silent', '--dir', './public', '--hostname', '127.0.0.1', '--port', '0'],
      )
    );

    expect(res.value).to.eql(0);
    expect(calls).to.have.length(1);
    expect(calls[0]).to.include({
      cwd,
      dir: './public',
      hostname: '127.0.0.1',
      port: 0,
      silent: true,
      keyboard: false,
    });
  });

  it('rejects root-only options on config add', async () => {
    const cwd = await tempRoot();
    const res = await captureInfo(() =>
      cli(cwd, ['config', 'add', '--silent', '--config', CONFIG])
    );

    expect(res.value).to.eql(1);
    expect(res.output).to.contain('Unexpected option for config add: --silent');
  });

  it('creates static config from config add defaults', async () => {
    const cwd = await tempRoot();
    const res = await captureInfo(() => cli(cwd, ['config', 'add', '--config', CONFIG]));

    expect(res.value).to.eql(0);
    expect(res.output).to.contain('created config');
    expect(await Fs.exists(Fs.join(cwd, CONFIG_PATH))).to.eql(true);
  });

  it('does not write config add dry-run', async () => {
    const cwd = await tempRoot();
    const res = await captureInfo(() =>
      cli(cwd, [
        'config',
        'add',
        '--dry-run',
        '--config',
        CONFIG,
        '--dir',
        './public',
        '--hostname',
        '127.0.0.1',
        '--port',
        '8080',
      ])
    );

    expect(res.value).to.eql(0);
    expect(res.output).to.contain('would create config');
    expect(await Fs.exists(Fs.join(cwd, CONFIG_PATH))).to.eql(false);
  });

  it('rejects extra positional arguments', async () => {
    const cwd = await tempRoot();
    const res = await captureInfo(() => cli(cwd, ['config', 'add', 'extra']));

    expect(res.value).to.eql(1);
    expect(res.output).to.contain('Unexpected argument: extra');
  });
});

async function tempRoot() {
  return (await Fs.makeTempDir({ prefix: 'sys.http.static.cli.' })).absolute;
}

async function captureInfo<T>(fn: () => Promise<T>) {
  const prev = console.info;
  const lines: string[] = [];
  console.info = (...args: unknown[]) => void lines.push(args.map(String).join(' '));
  try {
    const value = await fn();
    return { value, output: lines.join('\n') };
  } finally {
    console.info = prev;
  }
}
