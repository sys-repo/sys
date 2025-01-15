/**
 * Run in a child-process (hence the `-allow-run` requirement).
 */
import { Vite } from '@sys/driver-vite';
import { pkg } from '@sys/ui-react-devharness';

const input = './src/-test/index.html';
const server = await Vite.dev({ pkg, input });
await server.listen();
