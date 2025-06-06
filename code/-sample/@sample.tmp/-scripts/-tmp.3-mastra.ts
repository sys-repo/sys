import { Cli, c } from '@sys/cli';
import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';

const model = openai('gpt-4-turbo');
const agent = new Agent({
  name: 'WeatherAgent',
  instructions: 'Instructions for the agent...',
  model,
});

const spinner = Cli.spinner(`running ${c.magenta(model.modelId)}`);
const res = await agent.generate('What is the weather like?');
spinner.stop();

console.log('res', res);
