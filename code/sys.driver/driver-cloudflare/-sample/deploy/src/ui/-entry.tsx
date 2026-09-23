import { createRoot } from './common.ts';
import { App } from './ui.App.tsx';

/**
 * Main:
 */
const el = <App />;
createRoot(document.getElementById('root')!).render(el);
