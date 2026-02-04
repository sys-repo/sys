import { type t } from './common.ts';

const port = 4040;

export const origins: t.SlugHttpOriginsSpecMap = {
  localhost: {
    app: localhost(port),
    cdn: { default: localhost(port), video: localhost(port) },
  },
  production: {
    app: 'https://slc.db.team',
    cdn: { default: 'https://cdn.slc.db.team', video: 'https://video.cdn.slc.db.team' },
  },
};

/**
 * Helpers
 */
function localhost(port: t.PortNumber) {
  return `http://localhost:${port}`;
}
