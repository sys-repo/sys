import { Fs } from '@sys/fs';
import { DenoFile } from '@sys/driver-deno/runtime';
import { Vitepress } from '@sys/driver-vitepress';

const ws = await DenoFile.workspace();
await Fs.copy(Fs.join(ws.dir, 'deps.yaml'), './src/-tmpl/.sys/deps.yaml');

const Bundle = Vitepress.Tmpl.Bundle;
await Bundle.toFilemap();
await Bundle.toFilesystem(); // NB: test output.
