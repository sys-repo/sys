import { type t } from './mod.ts';
import { HttpProxy } from '@sys/http/server';

/**
 * Reverse proxy target scenarios.
 *
 * Local dev listener:
 * - `http://localhost:4040/`
 *
 * Root site passthrough:
 * - `http://localhost:4040/` → `https://tmp-socialleancanvas.orbiter.website/`
 * - `http://localhost:4040/about` → `https://tmp-socialleancanvas.orbiter.website/about`
 *
 * Mount (single segment):
 * - `http://localhost:4040/slc` → `308` → `http://localhost:4040/slc/`
 * - `http://localhost:4040/slc?x=1` → `308` → `http://localhost:4040/slc/?x=1`
 * - `http://localhost:4040/slc/` → `https://slc.db.team/tdb.slc/`
 * - `http://localhost:4040/slc/pkg/-entry.js` → `https://slc.db.team/tdb.slc/pkg/-entry.js`
 * - `http://localhost:4040/slc/images/ui.Programme/model.customer/customer-model.png`
 *      → `https://slc.db.team/tdb.slc/images/ui.Programme/model.customer/customer-model.png`
 *
 * Mount (multi segment):
 * - `http://localhost:4040/foo/bar/slc` → `308` → `http://localhost:4040/foo/bar/slc/`
 * - `http://localhost:4040/foo/bar/slc/` → `https://slc.db.team/tdb.slc/`
 * - `http://localhost:4040/foo/bar/slc/pkg/-entry.js` → `https://slc.db.team/tdb.slc/pkg/-entry.js`
 * - `http://localhost:4040/foo/bar/slc/images/ui.Programme/start/slc-image.png`
 *      → `https://slc.db.team/tdb.slc/images/ui.Programme/start/slc-image.png`
 *
 * Production-shaped URLs we ultimately want to support:
 * - `https://socialleancanvas.com/` → `https://tmp-socialleancanvas.orbiter.website/`
 * - `https://socialleancanvas.com/slc/` → `https://slc.db.team/tdb.slc/`
 * - `https://socialleancanvas.com/foo/bar/slc/` → `https://slc.db.team/tdb.slc/`
 */

const config: t.HttpProxy.Config = {
  root: { upstream: 'https://tmp-socialleancanvas.orbiter.website/' },
  mounts: [
    {
      mountPath: '/foo/bar/slc/',
      upstream: 'https://slc.db.team/tdb.slc/',
    },
    {
      mountPath: '/slc/',
      upstream: 'https://slc.db.team/tdb.slc/',
    },
  ],
};

await HttpProxy.start({ config });
