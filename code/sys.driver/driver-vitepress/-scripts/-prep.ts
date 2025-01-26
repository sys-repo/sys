import { VitePress } from '@sys/driver-vitepress';
const Bundle = VitePress.Env.Tmpl.Bundle;

await Bundle.prep();
await Bundle.saveToFilesystem(); // NB: test output
