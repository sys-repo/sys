import { c, Cli, Env, Fs, Path } from '@sys/std-s';
// import { Q } from './-tmp.quilibrium.ts';

import { Q } from '@sys/driver-quilibrium';

// const match = await Fs.glob().find('code/**/-test.*');
// console.log('match', match);

/**
 * OpenAI
 */

// import OpenAI from 'openai';
// const openai = new OpenAI();
// const completion = await openai.chat.completions.create({
//   model: 'gpt-4o',
//   messages: [{ role: 'user', content: 'write a haiku about ai' }],
// });
// console.log('completion', completion);

/**
 * Finish up.
 */
await newFunction();
Deno.exit(0);

async function newFunction() {
  await Q.Release.pull();
}
