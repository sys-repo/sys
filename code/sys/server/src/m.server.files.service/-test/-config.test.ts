import { describe, expect, Fs, it, Testing } from '../../-test.ts';
import { loadConfig, policyOf, resolveRoot } from '../u/u.config.ts';

describe('FilesWebSocketService config', () => {
  it('loads config defaults and maps watch policy explicitly', async () => {
    const dir = await Testing.dir('FilesWebSocketService.config');
    const path = Fs.join(dir.dir, 'files.yaml');
    await Fs.write(path, 'root: ./docs\nport: 0\nwatch: true\n');

    const config = await loadConfig(path);
    expect(config).to.eql({
      root: './docs',
      port: 0,
      path: '/files',
      policy: '**',
      watch: true,
    });

    expect(policyOf(config)).to.include({
      list: '**',
      stat: '**',
      read: '**',
      watch: '**',
      manifest: true,
    });
  });

  it('omits watch policy authority when watch is false', async () => {
    const dir = await Testing.dir('FilesWebSocketService.no-watch');
    const path = Fs.join(dir.dir, 'files.yaml');
    await Fs.write(path, 'root: ./docs\npolicy: shell.yaml\n');

    const policy = policyOf(await loadConfig(path));
    expect(policy).to.include({ list: 'shell.yaml', stat: 'shell.yaml', read: 'shell.yaml' });
    expect(policy.watch).to.eql(undefined);
  });

  it('rejects invalid config with schema errors', async () => {
    const dir = await Testing.dir('FilesWebSocketService.schema');
    const path = Fs.join(dir.dir, 'files.yaml');
    await Fs.write(path, 'root: ./docs\nport: 65536\nextra: true\n');

    const error = await catchError(() => loadConfig(path));
    expect(error?.message).to.contain('FilesWebSocketService: invalid config:');
  });

  it('rejects source roots that escape the service cwd', () => {
    const dir = Fs.resolve('/tmp/files-service-root');
    expect(() => resolveRoot(dir, '../outside', 'test')).to.throw(
      /test: root escapes service cwd:/,
    );
  });
});

async function catchError(fn: () => Promise<unknown>): Promise<Error | undefined> {
  try {
    await fn();
  } catch (error) {
    if (error instanceof Error) return error;
    throw error;
  }
}
