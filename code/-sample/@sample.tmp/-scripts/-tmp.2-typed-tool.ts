import { openai } from '@ai-sdk/openai';
import { c, Cli } from '@sys/cli';
import { generateText, tool, zodSchema } from 'ai';
import { z } from 'zod';
type ModelName = Parameters<typeof openai>[0];

/**
 * AI-Primitive: prompt with schema and tool call-back.
 * Docs:
 *    https://ai-sdk.dev/docs
 */
const modelName: ModelName = 'o4-mini';
// const modelName: ModelName = 'o3-mini';

const model = openai(modelName);
const spinner = Cli.spinner(`prompting - ${c.magenta(modelName)}`).stop();

/**
 * Schema:
 */
export const FooSchema = z.object({ msg: z.string(), count: z.number() });
const FooJsonSchema = zodSchema(FooSchema);
export type Foo = z.infer<typeof FooSchema>;

/**
 * Tool:
 */
let echoCalls: Foo[] = [];

export const echo = tool({
  description: 'Echo back whatever message the user provided.',
  parameters: FooJsonSchema,
  execute: async (args) => {
    echoCalls.push(args);
    let { msg = 'no message provided', count = 0 } = args;

    count += 1;
    return {
      msg: `input.msg: ${msg}\n✨ Done echoing. count=${count}`,
      count,
    };
  },
});

const run = async () => {
  const prompt = `
    Call echo with: 
        { "msg": "Hello 🐷", "count": 0 } 
    call it 3 times, and increment the count on each call, 
    and change the message to: "Hello-🐷" where 🐷 is repeated the number of count times.
    then write the response in your reply
  `;

  console.info();
  console.info(c.cyan('Prompt:'));
  console.info(c.italic(c.gray(prompt)));
  console.info();

  /**
   * Make sure your prompt is structured so the LLM knows to invoke the tool.
   * For example:
   *
   *      “Please call echo: { \"msg\": \"Testing 1,2,3\" }”
   */
  spinner.start();
  const res = await generateText({
    model,
    prompt,
    tools: { echo },
    // (optional) maxSteps allows one function call + one final response:
    maxSteps: 5,
  });
  spinner.stop();

  console.info(c.gray('prompt response:\n'), c.gray(c.yellow(res.text)));
  console.info();
  console.info('tool calls:', echoCalls);
  console.info();
};

await run();
