import { Cli, Env, Http } from '@sys/std-s';

const env = await Env.load();

// console.log('m', m);
// const NYLAS_API = m.get('NYLAS_API_KEY');

/**
 * SAMPLE: Table
 */
const table = Cli.table(['Foo', 'Bar']).indent(2);
table.push();
table.push(['123456', 'abc']);
table.push(['333', 'Hello World 👋']);
table.render();
console.info();

/**
 * Nylas
 * https://developer.nylas.com/docs/v3/email/#one-click-unsubscribe-requirements-for-google-messages
 */

import * as Nylas from 'npm:nylas@7/';
export async function sampleNylas() {
  console.log('Nylas', Nylas);

  const NylasConfig = {
    apiKey: env.get('NYLAS_API_KEY'),
    apiUri: 'https://api.us.nylas.com',
    grandId: env.get('NYLAS_GRANT_ID'),
  };
  // const GRANT_ID = '29015d82-0c42-4bfb-a3ea-8add8e4bdf42';

  const http = Http.client({ accessToken: NylasConfig.apiKey });
  const url = `https://api.us.nylas.com/v3/grants/${NylasConfig.grandId}/messages?limit=5`;

  const spinner = Cli.spinner();
  const res = await http.get(url);

  spinner.succeed(`Done: ${res.status}`);
  // console.log('res', res);

  const json = await res.json();
  console.log('json', json);
}

/**
 *
 */
export async function sampleOpenAI() {
  // console.log('OpenAI', OpenAI);
}

// Finish up.
// await sampleNylas();
// await sampleOpenAI();

const m = Cli.args(Deno.args);
console.log('m', m);

/**
 * TODO 🐷 arts passed for try/test/ci
 */

Deno.exit(0);
