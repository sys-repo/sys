import { Http } from '@sys/http/client';

const message = `plain-bridge http=${typeof Http}`;
const root = document.getElementById('root');
if (root) root.textContent = message;

console.info('plain-bridge', message);
