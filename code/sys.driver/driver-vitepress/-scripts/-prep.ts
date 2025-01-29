import { Vitepress } from '@sys/driver-vitepress';
const Bundle = Vitepress.Env.Tmpl.Bundle;

await Bundle.toFilemap();
await Bundle.toFilesystem(); // NB: test output
