import { Cli, describe, expect, Fs, it } from '../../../-test.ts';
import { cli } from '../m.cli/mod.ts';

const CONFIG = 'app';
const CONFIG_PATH = '-config/@sys.http/proxy/app.yaml';

describe('HttpProxy CLI', () => {
  it('shows root owner help', async () => {
    const cwd = await tempRoot();
    const res = await captureInfo(() => cli(cwd, ['--help']));

    expect(res.value).to.eql(0);
    expect(res.output).to.contain('@sys/http/server/proxy');
    expect(res.output).to.contain('Reverse proxy config owner endpoint.');
    expect(res.output).to.contain('config --help');
    expect(res.output).to.contain('root --help');
    expect(res.output).to.contain('mount --help');
    expect(res.output).to.contain('Asset route closure');
    expect(res.output).to.contain('Path-prefix mounts are routing only');
    expect(res.output).to.contain('mount those prefixes');
    expect(res.output.includes('Cell')).to.eql(false);
  });

  it('shows config namespace help', async () => {
    const cwd = await tempRoot();
    const res = await captureInfo(() => cli(cwd, ['config', '--help']));

    expect(res.value).to.eql(0);
    expect(res.output).to.contain('Manage durable config for reverse proxy instances.');
    expect(res.output).to.contain('config add [options]');
  });

  it('shows config add help', async () => {
    const cwd = await tempRoot();
    const res = await captureInfo(() => cli(cwd, ['config', 'add', '--help']));

    expect(res.value).to.eql(0);
    expect(res.output).to.contain('@sys/http/server/proxy config add');
    expect(res.output).to.contain('--config <name|path>');
    expect(res.output).to.contain('--dry-run');
    expect(res.output).to.contain('does not start a server');
  });

  it('shows root namespace help', async () => {
    const cwd = await tempRoot();
    const res = await captureInfo(() => cli(cwd, ['root', '--help']));

    expect(res.value).to.eql(0);
    expect(res.output).to.contain(
      'Manage the proxy default route (`/`) for requests that do not match a mount.',
    );
    expect(res.output).to.contain('root set [options]');
    expect(res.output).to.contain('create or update the durable `/` default upstream');
  });

  it('shows root set help', async () => {
    const cwd = await tempRoot();
    const res = await captureInfo(() => cli(cwd, ['root', 'set', '--help']));

    expect(res.value).to.eql(0);
    expect(res.output).to.contain('@sys/http/server/proxy root set');
    expect(res.output).to.contain('--upstream <url>');
    expect(res.output).to.contain('proxy default route (`/`)');
    expect(res.output).to.contain('mounts are preserved and still win over the default route');
    expect(res.output).to.contain('does not start a server');
  });

  it('shows mount namespace help', async () => {
    const cwd = await tempRoot();
    const res = await captureInfo(() => cli(cwd, ['mount', '--help']));

    expect(res.value).to.eql(0);
    expect(res.output).to.contain(
      'Manage non-root path-prefix routes that win over the default route.',
    );
    expect(res.output).to.contain('mount add [options]');
    expect(res.output).to.contain('create or update a durable non-root path-prefix upstream');
    expect(res.output).to.contain('A mount only covers its own prefix');
  });

  it('shows mount add help', async () => {
    const cwd = await tempRoot();
    const res = await captureInfo(() => cli(cwd, ['mount', 'add', '--help']));

    expect(res.value).to.eql(0);
    expect(res.output).to.contain('@sys/http/server/proxy mount add');
    expect(res.output).to.contain('non-root path-prefix mount');
    expect(res.output).to.contain('--mount <route>');
    expect(res.output).to.contain('--upstream <url>');
    expect(res.output).to.contain('Use `root set` for `/`');
    expect(res.output).to.contain('Mounts win over the default route');
    expect(res.output).to.contain('Asset route closure');
    expect(res.output).to.contain('`--mount /app/` forwards only `/app/**`');
    expect(res.output).to.contain('browser requests to `/view/**` do not pass through `/app/`');
    expect(res.output).to.contain('inspect the upstream document base and asset prefixes');
    expect(res.output).to.contain('<base href="/view/foo/">');
    expect(res.output).to.contain('Asset route closure example');
    expect(res.output).to.contain('--mount /view/ --upstream http://127.0.0.1:5050/');
    expect(res.output).to.contain('does not start a server');
  });

  it('rejects unknown CLI flags before running a command', async () => {
    const cwd = await tempRoot();
    const res = await captureInfo(() => cli(cwd, ['--wat']));

    expect(res.value).to.eql(1);
    expect(res.output).to.contain('Unknown option: --wat');
  });

  it('rejects mount-only options on config add', async () => {
    const cwd = await tempRoot();
    const res = await captureInfo(() =>
      cli(cwd, ['config', 'add', '--config', CONFIG, '--mount', '/api/'])
    );

    expect(res.value).to.eql(1);
    expect(res.output).to.contain('Unexpected option for config add: --mount');
  });

  it('creates proxy config from config add defaults', async () => {
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

  it('creates config and root upstream from root set defaults', async () => {
    const cwd = await tempRoot();
    const res = await captureInfo(() =>
      cli(cwd, [
        'root',
        'set',
        '--config',
        CONFIG,
        '--upstream',
        'http://127.0.0.1:4040/',
      ])
    );

    expect(res.value).to.eql(0);
    expect(res.output).to.contain('created config and set root');
    expect(await Fs.exists(Fs.join(cwd, CONFIG_PATH))).to.eql(true);
  });

  it('does not write root set dry-run', async () => {
    const cwd = await tempRoot();
    const res = await captureInfo(() =>
      cli(cwd, [
        'root',
        'set',
        '--dry-run',
        '--config',
        CONFIG,
        '--upstream',
        'http://127.0.0.1:4040/app/',
      ])
    );

    expect(res.value).to.eql(0);
    expect(res.output).to.contain('would create config and set root');
    expect(await Fs.exists(Fs.join(cwd, CONFIG_PATH))).to.eql(false);
  });

  it('creates config and mount from mount add defaults', async () => {
    const cwd = await tempRoot();
    const res = await captureInfo(() =>
      cli(cwd, [
        'mount',
        'add',
        '--config',
        CONFIG,
        '--mount',
        '/payments/',
        '--upstream',
        'http://127.0.0.1:4040/payments/',
      ])
    );

    expect(res.value).to.eql(0);
    expect(res.output).to.contain('created config and mount');
    expect(await Fs.exists(Fs.join(cwd, CONFIG_PATH))).to.eql(true);
  });

  it('does not write mount add dry-run', async () => {
    const cwd = await tempRoot();
    const res = await captureInfo(() =>
      cli(cwd, [
        'mount',
        'add',
        '--dry-run',
        '--config',
        CONFIG,
        '--mount',
        '/api/',
        '--upstream',
        'http://127.0.0.1:4040/api/',
      ])
    );

    expect(res.value).to.eql(0);
    expect(res.output).to.contain('would create config and mount');
    expect(await Fs.exists(Fs.join(cwd, CONFIG_PATH))).to.eql(false);
  });

  it('rejects extra positional arguments', async () => {
    const cwd = await tempRoot();
    const config = await captureInfo(() => cli(cwd, ['config', 'add', 'extra']));
    const root = await captureInfo(() => cli(cwd, ['root', 'set', 'extra']));
    const mount = await captureInfo(() => cli(cwd, ['mount', 'add', 'extra']));

    expect(config.value).to.eql(1);
    expect(config.output).to.contain('Unexpected argument: extra');
    expect(root.value).to.eql(1);
    expect(root.output).to.contain('Unexpected argument: extra');
    expect(mount.value).to.eql(1);
    expect(mount.output).to.contain('Unexpected argument: extra');
  });
});

async function tempRoot() {
  return (await Fs.makeTempDir({ prefix: 'sys.http.proxy.cli.' })).absolute;
}

async function captureInfo<T>(fn: () => Promise<T>) {
  const prev = console.info;
  const lines: string[] = [];
  console.info = (...args: unknown[]) => void lines.push(args.map(String).join(' '));
  try {
    const value = await fn();
    return { value, output: normalizeOutput(lines.join('\n')) };
  } finally {
    console.info = prev;
  }
}

function normalizeOutput(output: string): string {
  return Cli.stripAnsi(output).replace(/\s+/g, ' ').trim();
}
