import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

import { Env } from '@sys/fs/env';
import { Slug } from '@sys/tools/staging/prog';
import { buildDocumentDAG } from '../cmd.doc.graph/mod.ts';
import { RepoProcess } from '../cmd.repo.daemon/mod.ts';
import { type t, c, Cli, Crdt, D, Is, Prompt, Schedule, Str } from '../common.ts';
import { Fmt as BaseFmt } from '../u.fmt.ts';

const env = await Env.load();
let OPENAI_API_KEY = env.get('OPENAI_API_KEY');

const Fmt = {
  ...BaseFmt,
  headerTable(model?: string, subjectId?: t.Crdt.Id) {
    const table = Cli.table();
    const kv = (k: string, value: t.Json = '') => table.push([c.gray(k), String(value)]);
    kv('model', c.gray(model || '-'));
    kv('subject', c.gray(subjectId ? Fmt.prettyUri(subjectId) : '-'));
    return Str.trimEdgeNewlines(String(table)) + '\n';
  },
} as const;

type O = Record<string, unknown>;
type Client = t.Crdt.Cmd.Client;

export async function tmp(cwd: t.StringDir, docid: t.Crdt.Id, yamlPath: t.ObjectPath) {
  const port = D.port.repo;

  async function run(life: t.Lifecycle) {
    const cmd = await RepoProcess.tryClient(port);
    if (!cmd) return;
    life.dispose$.subscribe(() => cmd?.dispose());

    /** Calculate DAG: */
    const spinner = Cli.spinner(Fmt.spinnerText('walking graph...'));
    const dag = await buildDocumentDAG(cmd, docid, yamlPath);
    spinner.stop();

    let subjectId: t.Crdt.Id | undefined;
    const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const model = openai('gpt-5.1');

    const warn = (msg: string) => {
      const str = Str.builder()
        .blank()
        .line(c.yellow(c.italic(msg)))
        .line();
      console.info(String(str));
    };

    // 🌸🌸 ---------- CHANGED: openai-chat-render ----------
    /** Screen render */
    async function render(): Promise<void> {
      console.clear();
      if (!OPENAI_API_KEY) {
        warn('  Set OPENAI_API_KEY in your .env file');
        Schedule.macro(life.dispose);
        return;
      }

      console.info(Fmt.headerTable(model.modelId, subjectId));

      const message = !subjectId ? 'Enter slug to chat with (crdt:id)' : '';
      const input = await Prompt.Input.prompt({ message });

      if (Crdt.Is.id(input) || Crdt.Is.uri(input)) {
        subjectId = Crdt.Id.clean(input);
        return render();
      }

      if (!subjectId) {
        return render();
      }

      /** Lookup the document, and extract script. */
      const seq = await Slug.Sequence.fromDag(dag, yamlPath, subjectId);
      const scripts = (seq ?? [])
        .map((m) => ('script' in m && Is.str(m.script) ? m.script : ''))
        .filter(Boolean);
      const context = scripts.join('\n\n');

      if (scripts.length === 0) {
        subjectId = undefined;
        warn('No scripts found in slug, please try another one');
        await Schedule.sleep(3000);
        return render();
      }

      /** Query the model */
      const spinner = Cli.spinner();
      const { text } = await generateText({
        model,
        system: [
          'You are a clear, precise teaching assistant.',
          'Answer questions using only the information in the time-coded scripts.',
          'If the scripts do not contain enough information, say you do not know.',
          'Never refer to the script, this is your tacit knowledge that you are speaking from authoratively,',
          'as though a world class, thoughtful and gifted teacher who explains things with clarity, elegance',
          'and never condescends to the user. Be very concise, yet still clear and helpful.',
          'Zen like responses in profundity and clarity.',
        ].join(' '),
        prompt: [
          'Time-coded scripts:',
          context || '(no script content provided)',
          '',
          `User question: ${input}`,
          '',
          'Answer clearly and concisely for a motivated learner.',
        ].join('\n'),
      });
      spinner.stop();

      console.info();
      console.info(c.yellow(c.italic(text)));
      console.info();

      // Wait here until user hits Enter, then start a fresh render.
      await Prompt.Input.prompt({ message: '' });
      return render();
    }
    // 🌸 ---------- /CHANGED ----------

    await render();
  }

  // Wait here until (Ctrl-C).
  await Cli.keepAlive({
    exitCode: 0,
    onStart: async (life) => await run(life),
  });
}
