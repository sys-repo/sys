import { type t, Fs, expect } from './common.ts';
import { verifyPreview } from '../m.pipeline/u.verify.ts';

export async function assertPreviewServesBuiltApp(url: t.StringUrl) {
  await verifyPreview(url);
}

export async function assertStageUsesGeneratedRootEntry(args: {
  readonly entrypoint: string;
  readonly entryPaths: string;
}) {
  const entry = (await Fs.readText(args.entrypoint)).data ?? '';
  const entryPaths = (await Fs.readText(args.entryPaths)).data ?? '';

  expect(entry).to.include(`import { Fs } from '@sys/fs';`);
  expect(entry).to.include(`import { targetDir } from './entry.paths.ts';`);
  expect(entry).to.include(`const cwd = Fs.Path.fromFileUrl(new URL('.', import.meta.url));`);
  expect(entry).to.include(`export default await DenoEntry.serve({ cwd, targetDir });`);
  expect(entryPaths).to.include(`export const targetDir = './`);
}
