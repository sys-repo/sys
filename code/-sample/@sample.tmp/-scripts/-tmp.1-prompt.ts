import { c, Cli } from '@sys/cli';

import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

/**
 * AI-Primitive: prompt a hosted LLM model.
 */
type ModelName = Parameters<typeof openai>[0];
const modelName: ModelName = 'o3-mini';
const spinner = Cli.spinner(`prompting - ${c.magenta(modelName)}`).stop();

const run = async (prompt: string) => {
  console.info(c.cyan('Prompt:'));
  console.info(c.italic(c.gray(prompt)));

  spinner.start();
  const res = await generateText({ model: openai(modelName), prompt });
  spinner.stop();
  console.log('files:', res.files);
  console.log(c.green('prompt response:\n'), c.gray(c.yellow(res.text)));
  console.info();
};

await run(`
    const foo = { msg?: string } 

    ↑ write the typescript type, and then define it as zod schema, 
      in a clear best-practice modern TS/ESM idiom manner and quality.

  `);
