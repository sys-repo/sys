import { c, Cli, Fs } from './common.ts';

import { z } from 'zod';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { ChatOllama } from '@langchain/ollama';

export const zodSchema = z.object({
  answer: z.string().describe(`answer to the user's question`),
  source: z.string().describe(`website used to answer the user question.`),
});

const title = (...text: string[]) => console.info(...text.map((t) => c.green(c.bold(t))));

const model = new ChatOllama({
  // model: 'phi4-reasoning:plus',
  // model: 'phi3:mini-128k',
  model: 'phi4:latest',
  // model: 'deepseek-r1:7b',
});
const parser = StructuredOutputParser.fromZodSchema(zodSchema);

const chain = RunnableSequence.from([
  ChatPromptTemplate.fromTemplate(
    'Answer the users question as best as possible.\n' + '{format_instructions}\n{question}',
  ),
  model,
  parser,
]);
console.log(chain);

title('ƒ parser.getFormatInstructions');
const md = parser.getFormatInstructions();
console.log(md);

const image = await chain.getGraph().drawMermaidPng();
const bytes = new Uint8Array(await image.arrayBuffer());

title('Chain graph (diagram):');
console.info(image);
console.info();
await Fs.write('./.tmp/mermaid.jpg', bytes);

const spinner = Cli.spinner(`ƒ chain.invoke( "${c.green('question')}" )`);
const res = await chain.invoke({
  question: 'what is social lean canvas?',
  format_instructions: parser.getFormatInstructions(),
});

spinner.stop();
console.log(res);

// Display the format instructions
// Deno.jupyter.md`${parser.getFormatInstructions()}`;

console.info();
title('👋', `LLM Toolchain`);
console.info(` ↓ zod: (v4-mini): validation → standard schema | https://standardschema.dev/`);
console.info(` ↓ @lanchain: modular orchestration framework for provider-agnostic LLM workflows`);
console.info(` ↓ Ollama: local LLM runner (a "Docker" for pulling and running models)`);
console.info(` ↓ chain: ƒ runnable sequence`);
console.info(` ↓ chain: → markdown`);
console.info(` ↓ chain: → flowchart (image/diagram) → .jpg/png`);
console.info(` ↓ RAG Agent: (with Domain Specific knowledge) ← <ref: slc-kb>`);
console.info(` ↓ ${c.yellow('...')}`);

console.info();
Deno.exit(0);
