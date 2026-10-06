/// <reference types="vite/client" />

import { createRoot } from './common.ts';
import { Page } from './m.Page/mod.ts';
import managedImageUrl from './images/wax-seal.png?no-inline';

/**
 * Main:
 */
const el = <Page publicAssetBase={import.meta.env.BASE_URL} managedImageUrl={managedImageUrl} />;
createRoot(document.getElementById('root')!).render(el);
