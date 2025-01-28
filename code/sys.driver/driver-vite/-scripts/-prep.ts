import { Vite } from '@sys/driver-vite';
const Bundle = Vite.Tmpl.Bundle;

await Bundle.toFilemap();
await Bundle.toFilesystem(); // NB: test output
