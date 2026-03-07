import { join } from 'jsr:@std/path/join';

const root = document.getElementById('root');
if (root) root.textContent = join('sample', 'std-path');

