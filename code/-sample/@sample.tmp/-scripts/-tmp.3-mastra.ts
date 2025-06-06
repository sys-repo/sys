import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';
import { Cli, c } from '@sys/cli';
import { Obj, Str } from '@sys/std';

/**
 * ref:
 */

const model = openai('o4-mini');
const agent = new Agent({
  name: 'Sample',
  instructions: `
    You are an expert reasoning assistant that takes instructions and shuffles
    JSON args in and out of tools.
    
    Call \`echo\` with: 
        { "msg": "Hello 🐷", "count": 1, "fibonacci": [...] } 

    Call it 4-times, and increment the count on each call, eg. count: 1..2..
    format the message to read: "Hello-🐷" where 🐷 is repeated the number of count times.
    You always respond in parsable, valid JSON.
  `,
  model,
});

console.info();
const spinner = Cli.spinner(`running ƒ( ${c.magenta(model.modelId)} )`);
const res = await agent.generate('What is the weather like?');
spinner.stop();

console.info(c.cyan(`\nsteps:`));
res.steps.forEach((step) => {
  console.info('🌳');
  console.info(c.cyan(`- step.type:`), step.stepType);
  console.info(c.cyan(`- step.warnings:`), step.warnings);
  console.info(c.cyan(`- step.reasoning:`), step.reasoning);
  console.info(c.cyan(`- step.reasoningDetails:`), step.reasoningDetails);
  console.info(c.cyan(`- step.usage:`), step.usage);
  console.info(c.cyan(`- step.text:\n`), Str.truncate(step.text, 30));
});

const parsed = Obj.Json.safeParse(res.text);
console.info(c.cyan(`\nresponse text:\n\n`), parsed.ok ? parsed.data : parsed);
