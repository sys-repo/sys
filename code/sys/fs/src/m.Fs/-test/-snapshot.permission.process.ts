import { describe, expect, it, type t } from '../../-test.ts';
import { Fs } from '../mod.ts';

const CHILD = Fs.Path.fromFileUrl(
  new URL('./u.snapshot.permission.process.ts', import.meta.url),
) as t.StringAbsolutePath;
const decoder = new TextDecoder();

async function run(
  permission: string,
  mode: 'allowed' | 'denied',
  root: string,
  path: string,
) {
  return await new Deno.Command(Deno.execPath(), {
    args: ['run', '--frozen', '--cached-only', '--no-prompt', permission, CHILD, mode, root, path],
    cwd: Fs.cwd(),
    stdin: 'null',
    stdout: 'piped',
    stderr: 'piped',
  }).output();
}

function report(output: Deno.CommandOutput): Record<string, unknown> {
  const stderr = decoder.decode(output.stderr);
  if (!output.success) throw new Error(stderr);
  expect([output.code, stderr]).to.eql([0, '']);
  return JSON.parse(decoder.decode(output.stdout));
}

describe('Fs.Snapshot narrow read permission', () => {
  it('reads only below the selected root while ancestor authority remains denied', async () => {
    const temp = await Deno.makeTempDir({ prefix: 'sys-fs-snapshot-permission-' });
    const root = await Deno.realPath(temp) as t.StringAbsoluteDir;
    const path = Fs.join(root, 'source.bin') as t.StringAbsolutePath;
    try {
      await Deno.writeFile(path, new Uint8Array([1, 2, 3, 4]));
      const output = await run(`--allow-read=${root}`, 'allowed', root, path);
      const value = report(output);
      expect(value).to.include({ ancestorDenied: true, path, byteLength: 4 });
      expect(value.bytes).to.eql([1, 2, 3, 4]);
      expect(['device-inode', 'metadata-only']).to.include(value.evidence);
    } finally {
      await Deno.remove(root, { recursive: true });
    }
  });

  it('returns permission-denied without read authority', async () => {
    const temp = await Deno.makeTempDir({ prefix: 'sys-fs-snapshot-denied-' });
    const root = await Deno.realPath(temp) as t.StringAbsoluteDir;
    const path = Fs.join(root, 'source.bin') as t.StringAbsolutePath;
    try {
      await Deno.writeFile(path, new Uint8Array([1, 2, 3, 4]));
      const output = await run('--deny-read', 'denied', root, path);
      expect(report(output)).to.eql({ failure: 'permission-denied' });
    } finally {
      await Deno.remove(root, { recursive: true });
    }
  });
});
