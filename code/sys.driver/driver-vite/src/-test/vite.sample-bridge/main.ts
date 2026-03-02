import { Str } from '@sys/std';
import { Rx } from '@sys/std/rx';

const message = `@sys bridge ${Str.bytes(1024)}`;
const root = document.getElementById('root');
if (root) root.textContent = message;

console.info('sample-bridge', message);
console.info('sample-bridge-rx', typeof Rx);
