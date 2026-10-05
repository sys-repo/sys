/// <reference types="vite/client" />

import { createRoot } from './common.ts';
import { App } from './ui.App.tsx';

/**
 * Main:
 */
const el = <App publicAssetBase={import.meta.env.BASE_URL} />;
createRoot(document.getElementById('root')!).render(el);
