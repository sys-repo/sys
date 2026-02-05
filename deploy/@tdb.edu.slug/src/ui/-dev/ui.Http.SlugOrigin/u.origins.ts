import { type t, ClientLoader } from './common.ts';

export const origins: t.SlugHttpOriginsSpecMap = {
  localhost: ClientLoader.Origin.parse('http://localhost:4040'),
  production: ClientLoader.Origin.parse('https://slc.db.team'),
};
