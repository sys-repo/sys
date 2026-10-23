import { Fs } from './u.fixture.ts';

/** Materialize the nested Dist-shaped tree used by sealing and removal tests. */
export async function writeDistTree(root: string, name = 'generation'): Promise<string> {
  const target = Fs.join(root, name);
  await Deno.mkdir(Fs.join(target, 'pkg'), { recursive: true });
  await Deno.writeTextFile(Fs.join(target, 'dist.json'), 'manifest');
  await Deno.writeTextFile(Fs.join(target, 'pkg', 'main.js'), 'export default 123;');
  return target;
}

/** Read a mode value, failing the fixture when the host cannot provide one. */
export async function readMode(path: string): Promise<number> {
  const value = (await Deno.lstat(path)).mode;
  if (value === null) throw new Error(`Filesystem mode unavailable: ${path}`);
  return value;
}
