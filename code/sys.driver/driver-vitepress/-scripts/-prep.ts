import { VitePress } from '@sys/driver-vitepress';
const Bundle = VitePress.Env.Tmpl.Bundle;

await Bundle.toFilemap();
await Bundle.toFilesystem(); // NB: test output
