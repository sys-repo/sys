import { ViteEntry } from '@sys/driver-vite/entry';
import { Path } from '@sys/fs/path';

const jsrPackageDir = Path.fromFileUrl(new URL('../', import.meta.url));
await ViteEntry.main(Deno.args, { jsrPackageDir });
