import { openai } from '@ai-sdk/openai';
import { c, Cli } from '@sys/cli';
import { generateText, tool, zodSchema } from 'ai';
import { ollama } from 'ollama-ai-provider';
import { z } from 'zod';

/**
 * AI-Primitive: prompt with schema and tool call-back.
 * Docs:
 *    https://ai-sdk.dev/docs
 */
const modelName = 'o4-mini';
const model = openai(modelName);

const spinner = Cli.spinner(`prompting - ${c.magenta(modelName)}`).stop();

/**
 * Schema:
 */
export const FooSchema = z.object({
  msg: z.string(),
  count: z.number(),
  fibonacci: z.number().array(),
});
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
      fibonacci: args.fibonacci,
    };
  },
});

const run = async () => {
  const prompt = `
    Call \`echo\` with: 
        { "msg": "Hello 🐷", "count": 1, "fibonacci": [...] } 
    Call it 3-times, and increment the count on each call, eg. 1..2..
    format the message to read: "Hello-🐷" where 🐷 is repeated the number of count times.
    Return a clean, simple, single line summary for logging - confirming completion.
  `;

  console.info();
  console.info();
  console.info(c.cyan('Prompt:'));
  console.info(c.italic(c.gray(prompt)));
  console.info();

  /**
   * Make sure your prompt is structured so the LLM knows to invoke the tool.
   * For example:
   *
   *      “Please call `echo`: { \"msg\": \"Testing 1,2,3\" }”
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

  const totalFib = echoCalls.reduce((acc, next) => acc + sum(next.fibonacci), 0);
  console.info(c.cyan(`Prompt response (${modelName}):\n\n`), c.gray(c.yellow(res.text)));
  console.info();
  console.info(c.cyan('Tool invocations:'), echoCalls);
  console.info(c.gray('Fibonacci sum:'), totalFib);
  console.info();
  console.info();
};

await run();

function sum(nums: number[]): number {
  return nums.reduce((total, n) => total + n, 0);
}
