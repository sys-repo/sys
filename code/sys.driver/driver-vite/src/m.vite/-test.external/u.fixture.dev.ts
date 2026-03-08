import { Fs, Http, SAMPLE, Testing, pkg, type t } from '../../-test.ts';
import { Vite } from '../mod.ts';

export type DevSample = {
  readonly dev: t.ViteProcess;
  readonly html: { readonly status: number; readonly text: string };
  readonly main: { readonly status: number; readonly text: string };
};

export async function devSample(args: {
  sampleName: string;
  sampleDir: t.StringDir;
}): Promise<DevSample> {
  const { sampleName, sampleDir } = args;
  const port = Testing.randomPort();
  const fs = SAMPLE.fs(sampleName);
  await Fs.copy(sampleDir, fs.dir);

  const dev = await Vite.dev({ cwd: fs.dir, port, pkg, silent: true });

  try {
    await Http.Client.waitFor(dev.url, { timeout: 10_000, interval: 200 });

    const htmlRes = await fetch(dev.url);
    const html = { status: htmlRes.status, text: await htmlRes.text() };

    const mainRes = await fetch(`${dev.url}main.ts`);
    const main = { status: mainRes.status, text: await mainRes.text() };

    return { dev, html, main };
  } catch (error) {
    await dev.dispose();
    throw error;
  }
}
