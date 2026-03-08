import { Http } from '@sys/http/client';

const message = `@sys bridge http=${typeof Http}`;
const root = document.getElementById('root');
if (root) root.textContent = message;

console.info('sample-bridge', message);
console.info('sample-bridge-http', typeof Http);
